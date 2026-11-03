# 03 - Programmability: A Live xUDT Extension

This is the execution-focused section. It contains the C extension, the RISC-V build, the loader-compatibility work, and the live testnet transactions that prove the extension runs.

The extension is a **transfer cap**:

- Owner mode: always accept, so issuance and recovery still work.
- Non-owner mode: sum the amounts of group outputs whose lock differs from the first group input's lock. Reject if that sum exceeds the cap in the extension args.

The cap is stored per token in `type.args`, not baked into the C code. The same binary can enforce different caps for different token types.

---

## 1. Extension Source

`scripts/transfer_cap.c` uses only the syscall surface from the vendored `ckb-c-stdlib` headers (`ckb_consts.h`, `ckb_raw_syscalls.h`, `ckb_syscall_apis.h`).

Key properties:

- Exported symbol: `validate`.
- Signature: `int validate(int is_owner_mode, size_t extension_index, const uint8_t *args, size_t args_len)`.
- `args` is the extension script's `args` field, i.e. the 16-byte cap.
- `CKB_SOURCE_GROUP_INPUT` / `CKB_SOURCE_GROUP_OUTPUT` restrict iteration to cells of the current xUDT type.
- `CKB_CELL_FIELD_LOCK_HASH` is used to identify the sender and the recipients.
- All arithmetic is unsigned `__int128`; overflow is checked before accumulating.

Error codes:

| Code | Condition |
|---|---|
| `0` | Accept |
| `-100` | Args missing or not 16 bytes |
| `-101` | Cell-field or cell-data syscall failure |
| `-102` | Output data shorter than 16 bytes |
| `-103` | Accumulator overflow |
| `-104` | Non-sender output sum exceeds cap |

The code deliberately does **not** parse `XudtData`; it only reads the amount prefix. That is valid when the token stores no per-extension data, which is the case here.

---

## 2. Build

`scripts/build.sh` targets `riscv64-unknown-elf` with `rv64imac` / `lp64`, no libc, and `-fPIC`.

```bash
cd xudt/03_programmability/scripts
./build.sh
```

Observed artifacts:

```text
-rwxr-xr-x 1 cokoo cokoo 3568 Oct 20 19:39 transfer_cap.so
-rwxr-xr-x 1 cokoo cokoo 2888 Oct 20 19:39 transfer_cap.elf
aa529c9ee859abfd8250d4466620fffc2200e29d276d7656159cebece0a2f599  transfer_cap.so
9eafe12ced2c1aa0862b3bb32c30c8ab3fde147c52de692f711728a0eb9cad62  transfer_cap.elf
```

The deployed artifact is `transfer_cap.so` (3,568 bytes), not the static `.elf`.

The build is reproducible: re-running `./build.sh` produces a `transfer_cap.so`
with the same SHA-256, and the bytes of the live code cell fetched over RPC
compare equal to the local file byte for byte. The report's code hash can
therefore be re-derived from source without trusting the deployment record.

Inspect the program headers:

```bash
readelf -lW transfer_cap.so
```

The important lines are:

```text
LOAD 0x000000 0x0000000000000000 0x0000000000000000 0x000512 0x000512 R E 0x1000
LOAD 0x000518 0x0000000000001518 0x0000000000001518 0x000070 0x000070 RW  0x1000
```

The first `PT_LOAD` contains `.dynsym .gnu.hash .hash .dynstr .text`, starts at file offset `0` and virtual address `0`, and is the only executable segment. The second is a small RW segment for `.dynamic`.

---

## 3. Loader Compatibility Findings

This was the hard part. Three builds failed before the extension ran.

### 3.1 Static `ET_EXEC` fails with `-22`

The first deployed artifact was a static executable linked with:

```bash
ld.lld -static -e validate --export-dynamic ...
```

The mint transaction failed with:

```text
ValidationFailure: see error code -22
```

`-22` is `ERROR_INVALID_ELF` in `ckb_dlfcn.h`. The loader requires a dynamic symbol table:

- `SHT_DYNSYM` (`.dynsym`)
- `SHT_STRTAB` named `.dynstr`

A static `ET_EXEC` produced by `ld.lld -static --export-dynamic` has neither. `--export-dynamic` only affects the static symbol table (`.symtab`), not `.dynsym`. The extension must be a position-independent `ET_DYN` object.

### 3.2 Default shared layout fails with `InvalidInstruction`

The next build was a normal shared object. Its executable segment looked like this:

```text
LOAD 0x00023a 0x000000000000123a 0x000000000000123a 0x00000c 0x00000c R E 0x1000
```

`validate` was at `st_value = 0x123a`; the code bytes were at file offset `0x23a`. A no-syscall probe with this layout failed with:

```text
VM Internal Error: InvalidInstruction { pc: 217658, instruction: 0 }
```

`217658 = 0x3523a`, which is `base + 0x123a` for the probe's code buffer. The symbol address resolved, but the page at that address contained instruction `0`. In other words, the loader did not place the executable bytes where the symbol table said they were.

The working layout is page-aligned: the RX `PT_LOAD` starts at offset `0` / vaddr `0`, and all of `.dynsym`, `.dynstr`, and `.text` live in that one segment.

### 3.3 BSS gap and the final link

`-z norelro` removed a `.relro_padding` NOBITS gap that made the RW segment's `MemSiz` much larger than its `FileSiz` (`0xa78` vs `0x70`). `--no-rosegment` merged the read-only headers and `.text` into one RX `PT_LOAD`.

Final link command:

```bash
ld.lld -shared --gc-sections -z norelro --no-rosegment \
  -o transfer_cap.so transfer_cap.o
```

This produced the loadable layout shown in section 2.

### 3.4 Probe confirmation

Before spending capacity on the full extension, a minimal probe was deployed:

```c
int validate(int is_owner_mode, size_t extension_index,
             const uint8_t *args, size_t args_len) {
  if (is_owner_mode) return 0;
  return 1234;
}
```

With the corrected layout, the probe minted successfully. That proved two things at once:

1. The loader can resolve and call `validate`.
2. `is_owner_mode` is `1` for the owner mint (otherwise the mint would have failed with `1234`).

Probe artifacts:

| Item | Value |
|---|---|
| Binary | `probe_nr.so`, 1,896 bytes |
| SHA-256 | `b3c48802d7cc0b0ca5f5839f8b0579687c8a3180ac757070d772b729e016c8ce` |
| Code hash | `0x8e300163646c02e22060d2292cc17161ed74c7f2a5756db56e1d7e79a614e7b7` |
| Deploy tx | `0xc5a3062d0ded3fdb7b0dab66b0efb16045679fc4c99a5eded9ce03a554187619` |
| Block | `22804173` |

The earlier failing probe is retained for comparison:

| Item | Value |
|---|---|
| Binary | `probe.so`, 1,952 bytes, default LLD layout |
| Code hash | `0xd6258a669a7d00d246de0b64e5edc552586128447a264437a7ba159081ac663b` |
| Deploy tx | `0x3221069e3cb38f8d91f98584dae62044ee34bf817ba520326911506f02e2a0f7` |
| Failure | `InvalidInstruction { pc: 217658, instruction: 0 }` |

### 3.5 Deployment attempts timeline

Every attempt below is a real, committed code cell on Pudge. The deployments succeeded; the **first issuance** against them is what failed. The table is the honest record of the debugging path.

| # | Build | Deploy tx | Block | Code hash | First issuance result |
|---|---|---|---|---|---|
| 1 | static `ET_EXEC` (`-static --export-dynamic`) | `0xdda54ed2...` | 22803975 | `0xd3556ab3...` | `-22` `ERROR_INVALID_ELF` (no `.dynsym` / `.dynstr`) |
| 2 | `ET_DYN`, default LLD layout, relro padding present | `0xe229a283...` | 22804073 | `0x1863470323...` | `VM Internal Error: External("SourceEntry parse_from_u64 4128656")` on `Outputs[0].Type` |
| 3 | `ET_DYN`, `-z norelro`, default LLD layout | `0x3221069e...` | 22804119 | `0xd6258a66...` | `InvalidInstruction { pc: 217658, instruction: 0 }` |
| 4 | probe, `--no-rosegment` | `0xc5a3062d...` | 22804173 | `0x8e300163...` | **Success** - probe token minted in tx `0x6a754947...`, block 22804177 |
| 5 | `transfer_cap.so`, `--no-rosegment` | `0x2d3acfa6...` | 22804184 | `0x850564e9...` | **Success** - final token, see section 5 |

Attempt 2 is what motivated `-z norelro`: the relro padding left a `NOBS`/bss hole in the RW segment (`FileSiz 0x70` vs `MemSiz 0xa78`), and the resulting VM error pointed at a stack address used as a `source` argument. Removing the padding made the RW segment fully file-backed. Attempt 3 then isolated the remaining problem to the executable segment layout, which attempt 4 fixed.

The probe token from attempt 4 is still live on testnet with extension code hash `0x8e300163...`. It is a diagnostic artifact, not part of the delivered token.

---

## 4. Live Deployment

```bash
EXTENSION_BINARY=transfer_cap.so FORCE=1 node deploy_extension.mjs
```

Observed:

```text
== extension code cell ==
source:     transfer_cap.so
binary:     3568 bytes
sha256:     aa529c9ee859abfd8250d4466620fffc2200e29d276d7656159cebece0a2f599
code hash:  0x850564e93170669357324244c8381a6bef09be3e86b854609bc4a1a8baa08dbd (ckb blake2b, data1)
requested:  3576 CKB
capacity:   3629 CKB (on-chain value)

== broadcast ==
tx:        0x2d3acfa6a97ffc84221fb43ec8f48b841f08dd6d5503800d0f091a76cc6517d8
status:    committed
block:     22804184
```

| Field | Value |
|---|---|
| Code cell out point | `0x2d3acfa6a97ffc84221fb43ec8f48b841f08dd6d5503800d0f091a76cc6517d8:0` |
| Code hash / hash type | `0x850564e93170669357324244c8381a6bef09be3e86b854609bc4a1a8baa08dbd` / `data1` |
| Binary | 3,568 bytes |
| Capacity | 3,629 CKB |
| Block | 22804184 |

`data1` means the code hash is the blake2b-256 of the cell data. The cell is immutable: changing one byte changes the hash and therefore the token type.

A reporting detail worth keeping honest: the deploy script originally printed the capacity it *requested* (3,576 CKB, i.e. binary size plus 8). A cell that carries data also pays its own overhead, and the transaction builder raises the output capacity to 3,629 CKB, which is what actually landed on chain. The script now prints both the requested value and the on-chain value, and `deployment.testnet.json` stores the latter.

---

## 5. Live Mint

The owner lock hash is embedded in `type.args`. The mint transaction consumes an owner-lock cell, which makes the xUDT script set `is_owner_mode = 1` and skip the extension.

```bash
node issue_xudt.mjs
```

Observed:

```text
== token type ==
type args:  0xcd61c3a7ef0ec6542b7833d62317039a0490297bda58e01e8d28943139bcbb0f010000004d0000000800000045000000100000003000000031000000850564e93170669357324244c8381a6bef09be3e86b854609bc4a1a8baa08dbd0210000000e8030000000000000000000000000000
type hash:  0x82850594aee0634a38f38793f5c0c2d9552b91adb7f6b8fded6fe7c3c1cfc978
extension:  0x850564e93170669357324244c8381a6bef09be3e86b854609bc4a1a8baa08dbd (data1)
ext args:   0xe8030000000000000000000000000000 (cap 1000)

== broadcast ==
tx:        0xfa37c1187695ba0fe55a5e3d0078662ba2c4f5256a3fff8785da758842554573
status:    committed
block:     22804188
token cell: 0xfa37c1187695ba0fe55a5e3d0078662ba2c4f5256a3fff8785da758842554573:0
amount:     2000 units
capacity:   640 CKB
```

Args breakdown:

| Bytes | Meaning |
|---|---|
| `32` | Owner lock hash `0xcd61...bb0f` |
| `4` | Flags `01000000` = 1 (raw `ScriptVec`) |
| `rest` | `ScriptVec` with one extension: code hash `0x8505...`, hash type `data1`, args `0xe803...` = cap 1000 |

The token type hash `0x8285...` commits to the owner, the flags, the extension code hash, and the cap. Any change produces a different token.

---

## 6. Live Allowed Transfer

The holder owns the token cell but not the owner lock. The transfer consumes the 2,000-unit cell and produces:

- 500 units to the owner lock.
- 1,500 units back to the holder.

The sender is the first group input's lock (holder). The extension skips the 1,500-unit change and counts only the 500-unit output, which is within the 1,000 cap.

```bash
node transfer_xudt.mjs --amount 500
```

Observed:

```text
== transfer ==
amount:       500 units
cap:          1000 units
selected:     0xfa37c1187695ba0fe55a5e3d0078662ba2c4f5256a3fff8785da758842554573:0 (2000 units)
remaining:    1500 units

== balancing ==
inputs:  2
outputs: 3
first input is the xUDT cell: true
owner input present: false (holder pays the fee)

== broadcast ==
tx:        0xfff23bd1deba7eb5565117f7da40ac643b47f8d6e331a661a2ffe67b2ed73742
status:    committed
block:     22804194
output 0:  500 units -> 0xcd61c3a7ef0ec6542b7833d62317039a0490297bda58e01e8d28943139bcbb0f
output 1:  1500 units -> 0xbc9173ac65a3c3b1b38d2b0d4bf27ecb2e4f38053dfb47009589a81b43de042b

RESULT: PASS
```

This is the positive execution proof: the extension ran, read the cap from args, read the group input/output fields, and returned `0`.

---

## 7. Live Rejection

The same holder attempts to send 1,200 units. Supply conservation still holds:

```text
input:  1,500
output: 1,200 to owner + 300 change to holder = 1,500
```

So the sUDT check passes. The extension then sums the non-sender outputs (`1,200`), compares against the cap (`1,000`), and returns `-104`.

```bash
node transfer_xudt.mjs --amount 1200 --expect-reject
```

Observed:

```text
== transfer ==
amount:       1200 units
cap:          1000 units
expect:       REJECT
live cells:   2
  0xfff2...:0  500 units  320 CKB
  0xfff2...:1  1500 units  320 CKB
selected:     0xfff2...:1 (1500 units)
remaining:    300 units

== balancing ==
inputs:  2
outputs: 3
first input is the xUDT cell: true
owner input present: false (holder pays the fee)

== broadcast ==
rejected as expected
Client request error TransactionFailedToVerify: Verification failed Script(TransactionScriptError {
  source: Inputs[0].Type,
  cause: ValidationFailure: see error code -104 ...
})

RESULT: FAIL (cap enforced)
```

The rejection source is `Inputs[0].Type`, i.e. the xUDT type script itself. The full error is preserved in [`04_xudt-rfc/scripts/rejection-evidence.txt`](../04_xudt-rfc/scripts/rejection-evidence.txt).

No transaction hash exists for this attempt because CKB-VM rejected it before it could be committed.

---

## 8. Resulting Token State

After the allowed transfer:

| Cell | Amount | Lock |
|---|---|---|
| `0xfff23bd1...:0` | 500 units | owner `0xcd61...bb0f` |
| `0xfff23bd1...:1` | 1,500 units | holder `0xbc91...042b` |
| Total | 2,000 units | supply conserved |

The 2,000 issuance is unchanged; only its distribution changed.

---

## 9. Reproduction Commands

```bash
cd week8_report_builderTrack
npm install

cd xudt/03_programmability/scripts
./build.sh
readelf -lW transfer_cap.so

# These spend testnet capacity:
EXTENSION_BINARY=transfer_cap.so FORCE=1 node deploy_extension.mjs
node issue_xudt.mjs
node transfer_xudt.mjs --amount 500
node transfer_xudt.mjs --amount 1200 --expect-reject
```

The keys in `scripts/common.mjs` are **testnet demo keys**. Do not reuse them on mainnet.

---

## 10. Evidence Boundary and Limits

Proven:

- The extension is a real `data1` code cell on Pudge.
- `ckb_dlopen2` loads it and resolves `validate`.
- The owner mode path skips the extension for issuance.
- The non-owner path runs it and can reject with `-104`.
- The allowed and rejected paths differ only by the amount relative to the cap.

Not proven / deferred:

- No local `ckb-debugger` run; all execution evidence is testnet.
- `flags=2` (P2SH-style `ScriptVec` in witness) is not exercised.
- Multiple extensions and `XudtData` are not exercised.
- `owner_script` + `owner_signature` is not exercised.
- The extension assumes a single sender (first group input) and does not model multi-sender transactions.
- Mainnet is not attempted.

---

## Screenshot Slots

| Slot | Capture |
|---|---|
| `images/foto-3.png` | `./build.sh` output and `readelf -lW transfer_cap.so`, especially the RX LOAD at offset 0 |
| `images/foto-4.png` | Deploy output: code hash `0x8505...`, tx `0x2d3a...`, block `22804184` |
| `images/foto-5.png` | Mint output: token cell, 2,000 units, tx `0xfa37...`, block `22804188` |
| `images/foto-6.png` | Allowed transfer: 500 / 1,500, tx `0xfff2...`, block `22804194` |
| `images/foto-7.png` | Over-cap rejection: `Inputs[0].Type`, error `-104` |
