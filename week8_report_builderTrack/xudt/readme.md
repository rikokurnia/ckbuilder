# xUDT Module Report

This module traces xUDT from its sUDT-compatible data model to a live custom extension that enforces a transfer cap on Pudge testnet.

## Why xUDT Exists

Simple UDT gives CKB a minimal fungible token:

```text
data:  <amount: uint128 LE>
type:  code_hash = sUDT, args = <owner lock hash>
lock:  <user defined>
```

That is enough to issue and transfer, but every token-specific rule requires a different type script. xUDT keeps the sUDT amount layout and the owner-lock-hash prefix, then adds **flags plus extension data** to the type args. The same xUDT code hash can therefore host many rule sets, and each rule set is a separate script that the xUDT script loads and runs.

The module answers four questions in order:

1. What is added to the sUDT cell? ([01 Introduction](./01_introduction/readme.md))
2. How does xUDT decide that a transaction is valid? ([02 How xUDT works](./02_how-xudt-works/readme.md))
3. Can a custom rule actually execute on CKB? ([03 Programmability](./03_programmability/readme.md))
4. Which RFC clauses are proven, and which are deferred? ([04 xUDT RFC](./04_xudt-rfc/readme.md))

---

## Architecture at a Glance

```text
xUDT cell
  data:  amount (16 bytes LE) | optional XudtData
  type:  xUDT code | owner lock hash (32) | flags (4) | extension data
  lock:  holder lock

validation
  1. parse args, derive owner_mode
  2. if owner_mode: skip supply check and extension checks
  3. else: sum group inputs >= sum group outputs (sUDT rule)
  4. for each extension script:
       - load code (built-in, input-lock match, or ckb_dlopen2)
       - call validate(owner_mode, index, args, args_len)
       - any non-zero return rejects the transaction
```

The flags used in this report are `flags & 0x1FFFFFFF == 1`: a molecule `ScriptVec` is stored directly in `type.args`.

---

## Verification Summary

| Check | Evidence | Result |
|---|---|---|
| Legacy xUDT cell layout | Live cell `0x36bc...:0`, 21,000,000 units, 32-byte args | PASS |
| Extended args layout | Live 113-byte args: owner + `01000000` + `ScriptVec` | PASS |
| Extension code cell | `0x2d3a...:0`, code hash `0x8505...`, 3,568 bytes | PASS |
| Owner mint | 2,000 units, tx `0xfa37...`, block `22804188` | PASS |
| Non-owner transfer under cap | 500 units + 1,500 change, tx `0xfff2...` | PASS |
| Non-owner transfer over cap | 1,200 units, rejected `Inputs[0].Type` `-104` | PASS |
| RFC matrix | `04_xudt-rfc/scripts/rfc_conformance_check.js` | 8 PASS / 5 DEFERRED / 0 FAIL |

The `02` matrix is an offline model of the same rule. `03` is the live CKB-VM execution.

---

## What Is Proven, What Is Not

Proven:

- xUDT remains backward compatible with a 32-byte sUDT-style args value.
- A raw `ScriptVec` extension can be encoded in args and decoded by the live xUDT script.
- A custom C extension can be deployed as a `data1` code cell and loaded by `ckb_dlopen2`.
- Owner mode bypasses extension checks for the owner-lock input.
- A non-owner transfer runs the extension; the extension can reject a transaction with a custom error code.
- Supply conservation and the extension cap are independent checks: the 1,200-unit case satisfied input/output conservation but still failed `-104`.

Deferred:

- `flags & 0x1FFFFFFF == 2` (blake160 in args, `ScriptVec` in witness).
- Multiple extensions and per-extension `XudtData`.
- `owner_script` + `owner_signature` witness path.
- Owner-mode bits `0x20000000` / `0x40000000` / `0x80000000`.
- Mainnet deployment.

---

## Layout

```text
xudt/
├── scripts/common.mjs                 # CCC client, signers, u128, args, state
├── 01_introduction/
│   ├── readme.md
│   └── scripts/xudt_layout_demo.js
├── 02_how-xudt-works/
│   ├── readme.md
│   └── scripts/xudt_validation_trace.js
├── 03_programmability/
│   ├── readme.md
│   ├── vendor/ckb-c-stdlib/
│   └── scripts/
│       ├── transfer_cap.c
│       ├── build.sh
│       ├── deploy_extension.mjs
│       ├── issue_xudt.mjs
│       ├── transfer_xudt.mjs
│       ├── probe.c
│       ├── probe_nr.so
│       ├── transfer_cap.so
│       └── deployment.testnet.json
└── 04_xudt-rfc/
    ├── readme.md
    └── scripts/
        ├── rfc_conformance_check.js
        ├── rejection-evidence.txt
        └── rfc_conformance_result.json
```

## Shared Helpers

`scripts/common.mjs` centralizes:

- Pudge RPC client and owner/holder signers.
- `u128LE`, `readU128LE`, `decodeXudtData`.
- `encodeExtensionArgs`: owner hash + 4-byte flags + `ccc.ScriptVec.encode`.
- State load/save at `03_programmability/scripts/deployment.testnet.json`.
- Live cell discovery and explorer URLs.

The owner key is the repository's Week 7 testnet key. The holder key is used for non-owner transfers.

## Reproduce

```bash
cd week8_report_builderTrack
npm install

node xudt/01_introduction/scripts/xudt_layout_demo.js
node xudt/02_how-xudt-works/scripts/xudt_validation_trace.js
node xudt/04_xudt-rfc/scripts/rfc_conformance_check.js
```

For the live C extension and its transactions, see [03_programmability/readme.md](./03_programmability/readme.md).
