# 01 - Introduction to xUDT

xUDT is an extension of Simple UDT (sUDT) that keeps the minimal sUDT accounting model and adds an opt-in rule system. This section establishes the data model with a live testnet cell and then decodes the extended arguments used by the custom extension in module 03.

## 1. The sUDT Baseline

sUDT defines a fungible token cell as:

```text
data:  <amount: uint128 little-endian>
type:  code_hash = sUDT type script
       hash_type = type
       args     = <owner lock script hash: 32 bytes>
lock:  <user-defined lock>
```

The sUDT rule is intentionally small:

- If an **owner-lock input** exists, the transaction is in **owner mode** and may mint or burn freely.
- Otherwise, the sum of the amounts in **group inputs** must be at least the sum in **group outputs**.
- Group input/output means cells whose type script is exactly the running sUDT script, so multiple token types can coexist in one transaction.

This gives conservation but no place to express token-specific policy.

## 2. What xUDT Adds

xUDT keeps the first 32 bytes of args as the owner lock hash and adds a 4-byte flags field plus variable extension data:

```text
type.args:
  <owner lock hash: 32 bytes>
  <flags: uint32 little-endian>
  <extension data: variable>

data:
  <amount: uint128 little-endian>
  <optional XudtData>
```

The flags select how extension data is interpreted:

| `flags & 0x1FFFFFFF` | Meaning |
|---|---|
| `0` | Plain sUDT behavior; no extension data required (a 32-byte legacy args is also accepted) |
| `1` | `type.args` contains a molecule `ScriptVec` of extension scripts |
| `2` | `type.args` contains the blake160 hash of the `ScriptVec`; the full `ScriptVec` travels in the witness |

The upper bits are owner-mode switches (`0x20000000`, `0x40000000`, `0x80000000`) defined by the RFC. This report uses only the raw extension mode, `flags = 1`.

A `ScriptVec` entry is a normal CKB `Script`:

```text
table Script {
  code_hash: Byte32,
  hash_type: byte,
  args: Bytes,
}
vector ScriptVec <Script>
```

Each entry is an extension rule. When xUDT runs, it loads the code and calls:

```c
int validate(int is_owner_mode, size_t extension_index,
             const uint8_t* args, size_t args_len);
```

A return value of `0` means the extension accepted the transaction. Any other value rejects it.

## 3. Live sUDT-Style Cell

`xudt_layout_demo.js` reads the Week 7 token cell and the new Week 8 token metadata.

```bash
node xudt/01_introduction/scripts/xudt_layout_demo.js
```

Recorded output (the chain tip and the balance move between runs; the decoded
cell contents do not):

```text
== network ==
RPC:        https://testnet.ckb.dev/rpc
tip:        22804226 (0x15bf702)

== live week-7 xUDT cell ==
out point:  0x36bc583f34bc903d2e736a7a7f856606373185f5d3e48bec894eb2ac875a4997:0
capacity:   200 CKB
type:       0x25c29dc317811a6f6f3985a7a9ebc4838bd388d19d0feeecf0bcd60f6c0975bb (type)
type hash:  0x39278d35c3414b54150ded0e818ac02fd84f568a1339b4e141450fe8eb451df3
type args:  0xcd61c3a7ef0ec6542b7833d62317039a0490297bda58e01e8d28943139bcbb0f
raw data:   0x406f4001000000000000000000000000

== xUDT data layout ==
amount:     21000000 units (u128 LE, first 16 bytes)
extra data: 0x (0 bytes after amount)

== xUDT args layout ==
owner lock: 0xcd61c3a7ef0ec6542b7833d62317039a0490297bda58e01e8d28943139bcbb0f (first 32 bytes)
flags:      0 (0x0, next 4 bytes LE) [legacy 32-byte args: no extension]
extension:  0x (0 bytes)
owner == signer lock hash: yes (owner mode available)
```

This is a backward-compatibility proof: a 32-byte args value still behaves as sUDT. The amount is exactly the first 16 bytes; the remaining data is empty.

## 4. Extended Args Used in This Report

The Week 8 token uses:

```text
owner:  0xcd61c3a7ef0ec6542b7833d62317039a0490297bda58e01e8d28943139bcbb0f
flags:  0x01000000 (little-endian 1)
ScriptVec:
  script 0:
    code_hash: 0x850564e93170669357324244c8381a6bef09be3e86b854609bc4a1a8baa08dbd
    hash_type: data1
    args:      0xe8030000000000000000000000000000  (cap = 1000, u128 LE)
```

Serialized as 113 bytes:

```text
0x cd61c3a7ef0ec6542b7833d62317039a0490297bda58e01e8d28943139bcbb0f
   01000000
   4d000000 08000000 45000000 10000000 30000000 31000000
   850564e93170669357324244c8381a6bef09be3e86b854609bc4a1a8baa08dbd
   02
   10000000
   e8030000000000000000000000000000
```

The `ScriptVec` prefix is molecule-encoded. The exact bytes are produced with `ccc.ScriptVec.encode([script])`; hand-encoding the `Script` table is error-prone because the `Bytes` args field carries its own 4-byte length prefix.

## 5. Why This Matters

A single xUDT code hash can now represent:

- A plain token (no extension).
- A token with a transfer cap (this report).
- A token with an allowlist, vesting rule, or compliance check, without deploying a new token core.

The trade-off is that every extension script runs inside CKB-VM on every transfer, so extension code size, cycles, and failure semantics are part of the token's behavior.

## Evidence Boundary

- The legacy cell above is a real, live Pudge cell.
- The extended args are decoded from `deployment.testnet.json`, whose values come from the real mint transaction in module 03.
- This section proves the encoding, not the execution. Execution proof is in [03 Programmability](../03_programmability/readme.md).

## Screenshot Slot

Capture the terminal output of `node xudt/01_introduction/scripts/xudt_layout_demo.js` and save it as `images/foto-1.png`. The important frame is the `xUDT data layout` and `xUDT args layout` section.
