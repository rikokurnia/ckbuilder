# 🧪 03 - ssri-test: First Prototype Walkthrough + Live Deployment

> **Dispatch anatomy + code cell alive on Pudge testnet**
> Repo: [Hanssen0/ssri-test](https://github.com/Hanssen0/ssri-test) · bootstrapped with `ckb-script-templates` · README is literally `TODO: Write this readme`

---

## 🌟 Executive Summary

`ssri-test` is the **first SSRI-compliant contract prototype**: one RISC-V binary that acts as transaction verifier when called with empty argv, and as a query server when called with a method path. Its deployment receipt points to a **live code cell on Pudge testnet**, which becomes the execution target for module 04.

## 🔍 Dispatch Anatomy (vendored source)

`contracts/ssri-test/src/main.rs` — `program_entry_wrap()`:

1. `argv` empty → `fallback::fallback()` (returns `Ok(())` = original verifier path).
2. `vm_version() != u64::MAX` → `InvalidVmVersion` (off-chain gate: Talk says off-chain VM version is -1).
3. `ssri_methods!(argv, ...)` proc-macro dispatch → handler bytes → `set_content(&res)` (off-chain output channel).

Declared methods (macro auto-adds `SSRI.version/get_methods/has_methods`):

| Method | Handler (hardcoded demo) |
| :--- | :--- |
| `SSRI.get_cell_deps` | `Ok([0,0,0,0])` |
| `UDT.name` / `UDT.symbol` | `"Test"` |
| `UDT.decimals` | `[8]` |
| `UDT.balance` | 16-byte LE (`1<<64`) |

Supporting files: `udt.rs` (name only), `error.rs` (i8 exit codes incl. `InvalidMethodPath/Args`), `fallback.rs`, `syscall.rs` (raw `ecall` wrapper). Full source vendored at [`vendor/ssri-test/`](./vendor/ssri-test/).

## 🔗 Live Deployment Proof (Pudge testnet RPC)

Migration `2024-07-20-091011.json` → tx `0x900afcf79235e88f7bdf8a5d320365b7912f8074f4489a68405f43586fc51e5c:0`:

- Status 🟢 `committed`, block `#13,970,123`, output[0] = 33328-byte code cell (no type script).
- **Same outpoint appears in ssri-server's own README example** — confirming this is the canonical prototype deployment (testnet, not mainnet: mainnet RPC returns `unknown`).

```text
📦 Migration receipt: ssri-test, data_hash=0x5f1cbfc5...02ed6
🔍 Verifying deployment pointer on Pudge testnet RPC...
   ✅ Deploy tx found, status=committed
   Block: #13970123 ... Output[0] capacity=0x30965f2cd00 data_len=33328 bytes
📌 SSRI code cell for module 04: 0x900afcf7...fc51e5c:0
```

> 📸 **Execution Proof**: save terminal capture as `images/foto-3.png`.

Full output: [`scripts/prototype_walkthrough_demo.js`](./scripts/prototype_walkthrough_demo.js).

## 🚀 Reproduction Guide

```bash
cd week7_report_builderTrack
node "01_SSRI/03_ssri-test-prototype/scripts/prototype_walkthrough_demo.js"
```
