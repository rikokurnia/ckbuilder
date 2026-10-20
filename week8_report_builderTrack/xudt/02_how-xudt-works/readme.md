# 02 - How xUDT Works

This section explains the validation lifecycle and reproduces the decision rule used by the custom extension. The matrix here is an **offline model** of `transfer_cap.c`; the live CKB-VM proof is in module 03.

## 1. Validation Order

The reference implementation (`ckb-production-scripts/c/xudt_rce.c`) evaluates a transaction in this order:

```text
1. Load the current xUDT script and parse type.args.
2. Determine owner_mode.
3. If owner_mode is false, try the enhanced owner path
   (owner_script + owner_signature in witness).
4. Run simple_udt:
     owner_mode == 1  -> skip supply check
     owner_mode == 0  -> sum(group inputs) >= sum(group outputs)
5. If flags == 0, stop.
6. Decode ScriptVec and, for each extension:
     a. load the extension code
     b. optionally skip it if an input lock matches the extension hash
     c. call validate(owner_mode, index, args, args_len)
     d. reject on any non-zero return
7. Accept only if every extension returned 0.
```

Two consequences matter:

- The **sUDT conservation check always runs first** for non-owner transactions. An extension cannot be used to mint tokens out of nowhere.
- The extension sees `owner_mode` and can choose to bypass its own rule for the owner. The extension in this report does exactly that.

## 2. Owner Mode

The RFC defines four ways to make `is_owner_mode` true:

| Source | When it applies |
|---|---|
| Input lock | An input's lock hash equals the 32-byte owner hash in args |
| Output type | `flags & 0x40000000 != 0` and an output type hash equals the owner hash |
| Input type | `flags & 0x80000000 != 0` and an input type hash equals the owner hash |
| Witness | `owner_script` is present, its blake2b hash equals the owner hash, and the script validates |

The common case is the input lock. The mint transaction in module 03 consumes an owner-lock cell purely to authorize issuance, so the xUDT script sets `owner_mode = 1` before it ever loads the extension.

The output lock is deliberately not a source: output locks are not executed by CKB-VM during this validation pass.

## 3. Extension Code Loading

For each `ScriptVec` entry, xUDT tries three paths:

1. **Built-in hash**: a known hash such as `0x01...` maps to code embedded in xUDT itself. The reference implementation uses this for its regulation-compliance extension.
2. **Input lock match**: if the blake2b hash of the extension script equals the hash of an input lock script, the extension is considered already validated and is skipped.
3. **Dynamic load**: call `ckb_dlopen2(code_hash, hash_type, ...)`, find the `validate` symbol with `ckb_dlsym`, and call it.

The third path is the one exercised in this report. It has hard ELF requirements:

- `e_phnum <= 16`, `e_shnum <= 32`.
- A `SHT_DYNSYM` section and a `SHT_STRTAB` section named `.dynstr`.
- The extension must be position-independent (`ET_DYN`), because the loader maps it into a code buffer at runtime.

A plain static `ET_EXEC` does not contain `.dynsym` / `.dynstr`, so it fails at load time. That failure and its fix are documented in module 03.

## 4. Offline Decision Matrix

`xudt_validation_trace.js` builds the same args that the live token uses and applies the `transfer_cap.c` rule:

```bash
node xudt/02_how-xudt-works/scripts/xudt_validation_trace.js
```

Observed output:

```text
== inputs for this trace ==
owner lock hash:     0xcd61c3a7ef0ec6542b7833d62317039a0490297bda58e01e8d28943139bcbb0f
recipient lock hash: 0x7777777777777777777777777777777777777777777777777777777777777777
cap:                 1000 units
issue amount:        2000 units
extension flags:     1 (raw ScriptVec)

== extension decision matrix (mirrors transfer_cap.c) ==
case                                            result  code   reason
owner mint                                      PASS    0      owner mode bypass
transfer 500 to recipient + 1500 change         PASS    0      non-sender outputs 500 <= cap 1000
transfer 1000 to recipient (exact cap)          PASS    0      non-sender outputs 1000 <= cap 1000
transfer 1200 to recipient (over cap)           FAIL    -104   non-sender outputs 1200 > cap 1000
split 400 + 900 to two recipients (sum 1300)    FAIL    -104   non-sender outputs 1300 > cap 1000
```

The rule is:

```text
sender = lock hash of the first group input
sent   = sum of amounts of group outputs whose lock hash != sender
reject if sent > cap
```

`sent` is accumulated one output at a time, so a split transfer cannot evade the cap by keeping each individual output below it.

## 5. The Rule in C

The deployed extension is deliberately small:

```c
int validate(int is_owner_mode, size_t extension_index,
             const uint8_t *args, size_t args_len) {
  if (is_owner_mode) return 0;
  if (args == NULL || args_len != 16) return -100;

  unsigned __int128 cap = read_u128_le(args);

  uint8_t sender[32];
  uint64_t len = 32;
  int ret = ckb_load_cell_by_field(sender, &len, 0, 0,
                                   CKB_SOURCE_GROUP_INPUT,
                                   CKB_CELL_FIELD_LOCK_HASH);
  if (ret != CKB_SUCCESS || len != 32) return -101;

  unsigned __int128 sent = 0;
  for (size_t i = 0;; i++) {
    uint8_t lock[32];
    len = 32;
    ret = ckb_load_cell_by_field(lock, &len, 0, i,
                                 CKB_SOURCE_GROUP_OUTPUT,
                                 CKB_CELL_FIELD_LOCK_HASH);
    if (ret == CKB_INDEX_OUT_OF_BOUND) break;
    if (ret != CKB_SUCCESS || len != 32) return -101;
    if (bytes_equal(lock, sender, 32)) continue;

    uint8_t data[272];
    len = 272;
    ret = ckb_load_cell_data(data, &len, 0, i, CKB_SOURCE_GROUP_OUTPUT);
    if (ret != CKB_SUCCESS || len < 16) return -102;

    unsigned __int128 amount = read_u128_le(data);
    if (sent + amount < sent) return -103;
    sent += amount;
    if (sent > cap) return -104;
  }
  return 0;
}
```

## 6. Error Codes Used

| Code | Meaning |
|---|---|
| `0` | Accept |
| `-100` | Extension args are not exactly 16 bytes |
| `-101` | A cell-field syscall failed |
| `-102` | Output data is shorter than 16 bytes |
| `-103` | `sent` overflowed `u128` |
| `-104` | Non-sender output sum exceeded the cap |

The over-cap transaction in module 03 fails with `-104`. It is not a supply-conservation failure: inputs were 1,500 and outputs were 1,200 + 300, so the sUDT check passes and the extension is the component that rejects.

## Evidence Boundary

This section is a **model and code walkthrough**. It does not execute CKB-VM. The same rule is executed on testnet in [03 Programmability](../03_programmability/readme.md):
- 500 units accepted: tx `0xfff2...`
- 1,200 units rejected with `-104`.

## Known Limits of the Demo Rule

- The first group input is treated as the sender. A multi-sender transaction is not modelled.
- The cap applies only to outputs whose lock differs from the sender. Change back to the sender is not counted.
- The owner can always bypass the cap. That is intentional for issuance and recovery, but it means the cap is a holder-transfer policy, not a global supply policy.
- `MAX_CELL_DATA` is 272 bytes. A token cell with more data would make the extension return `-102` rather than parse it.

## Screenshot Slot

Capture the terminal output of `node xudt/02_how-xudt-works/scripts/xudt_validation_trace.js` and save it as `images/foto-2.png`. The important frame is the five-row decision matrix.
