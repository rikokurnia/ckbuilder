# 🟨 07 - CKB Script Course: Advanced Duktape Examples (Class 7)

> **Deploying and Executing JavaScript Smart Contracts on CKB-VM via Duktape (`ckb-js-vm`)**  
> Dynamic ECMAScript evaluation, CKB syscall bindings, and on-chain deployment verification on CKB Public Testnet.

---

## 🌟 Executive Summary

Nervos CKB is the only major Layer 1 blockchain capable of executing native **JavaScript** smart contracts directly on-chain. This is made possible by compiling **Duktape** (an embeddable, lightweight ECMAScript E5/E5.1 engine) into a bare-metal RISC-V ELF executable known as **`ckb-js-vm`**.

### Key Architectural Concepts:
1. **Duktape Engine on RISC-V**:
   - The `ckb-js-vm` binary acts as an on-chain JavaScript interpreter.
   - It exposes CKB-specific system bindings via the global `CKB` object, including:
     - `CKB.load_script()`: Resolves executing script code hash and args.
     - `CKB.load_tx_hash()`: Retrieves current transaction digest.
     - `CKB.load_cell_capacity(index, source)`: Queries cell capacities from inputs or outputs.
     - `CKB.debug(message)`: Emits debug traces to the CKB-VM syscall layer.
2. **JavaScript Contract Lifecycle**:
   - JS contracts are authored in standard JavaScript.
   - For production, code is bundled into JavaScript bytecode (`.bc`) using `ckb-js-vm` compiler or `esbuild`.
   - The transaction includes `ckb-js-vm` as a `cellDep` (`code_hash: 0x3e9b6bead927bef62fcb56f0c79f4fbd1b739f32dd222beac10d346f2918bed7`).
3. **Execution & Error Handling**:
   - If the script evaluates completely without throwing, the VM terminates with exit code `0` (Validation Success).
   - If an unhandled `throw new Error(...)` occurs, the VM immediately aborts with a non-zero exit code, safely reverting the transaction.

In this module, we authored a JavaScript validation contract verifying cell capacity conservation invariants, referenced the official `ckb-js-vm` system script, and committed the contract to the **CKB Public Testnet (Pudge)**.

---

## 🔗 On-Chain Testnet Verification Proof

| Parameter | Value / Details |
| :--- | :--- |
| **Network** | CKB Public Testnet (Pudge) |
| **Transaction Hash** | [`0xf45acdca6873eb9e9252580ac495d535587f77cd8ffe6f749dd6ee142049f827`](https://pudge.explorer.nervos.org/transaction/0xf45acdca6873eb9e9252580ac495d535587f77cd8ffe6f749dd6ee142049f827) |
| **Block Number** | `22,501,597` (`0x15758dd`) |
| **Block Hash** | `0x36228cc03583a6e660dec223fc52bcf72e58ba6c6fae54bcd9250e4e4bf6349f` |
| **Signer Address** | `ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwy0rpn3trq0sj2q6arv7xaq9w6m6xa0egxe8xvr` |
| **Target JS VM** | `ckb-js-vm` (Duktape engine on RISC-V) |
| **`ckb-js-vm` Code Hash** | `0x3e9b6bead927bef62fcb56f0c79f4fbd1b739f32dd222beac10d346f2918bed7` |
| **Output Cell Capacity** | `180.0 CKB` |
| **Status** | 🟢 `committed` |
| **Explorer Link** | [🔍 Inspect Transaction on CKB Explorer](https://pudge.explorer.nervos.org/transaction/0xf45acdca6873eb9e9252580ac495d535587f77cd8ffe6f749dd6ee142049f827) |

---

## 📸 Verification & Proof of Work

> Verified directly via on-chain transaction logs and CKB Testnet Explorer:  
> **Transaction Hash**: [`0xf45acdca6873eb9e9252580ac495d535587f77cd8ffe6f749dd6ee142049f827`](https://pudge.explorer.nervos.org/transaction/0xf45acdca6873eb9e9252580ac495d535587f77cd8ffe6f749dd6ee142049f827) (Committed in Block `#22,501,597`).

---

## ⚙️ Step-by-Step Practical Execution

1. **Authored JavaScript Smart Contract**:
   ```javascript
   function main() {
     var script = CKB.load_script();
     var txHash = CKB.load_tx_hash();
     var inputCap = CKB.load_cell_capacity(0, CKB.SOURCE_INPUT);
     var outputCap = CKB.load_cell_capacity(0, CKB.SOURCE_OUTPUT);
     if (outputCap > inputCap) {
       throw new Error("InvalidCapacityConservation");
     }
     return 0;
   }
   main();
   ```
2. **Assembled Cell with `ckb-js-vm` Dependency**:
   - Injected the official `ckb-js-vm` testnet `cellDep` (`0x756fdaf0d1ba1d2e03dc13c71c967b24021bc054893a766ccee6879c468892d2`, index 0).
   - Encoded the JS contract payload into hex and stored inside the cell's `outputsData`.
   - Set output capacity to `180.0 CKB`.
3. **On-Chain Confirmation**:
   - Broadcasted and committed in block `#22,501,597`.

---

## 💻 Terminal Execution Output

```text
Class 7: Advanced Duktape (ckb-js-vm) Smart Contract Deployment
-----------------------------------------------------------------
Signer address: ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwy0rpn3trq0sj2q6arv7xaq9w6m6xa0egxe8xvr
Current balance: 62422.99949669 CKB
Contract size: 370 bytes
Target VM: ckb-js-vm (Duktape engine on RISC-V)
ckb-js-vm code_hash: 0x3e9b6bead927bef62fcb56f0c79f4fbd1b739f32dd222beac10d346f2918bed7
Broadcasting transaction to CKB Testnet (Pudge)...
Transaction broadcasted: 0xf45acdca6873eb9e9252580ac495d535587f77cd8ffe6f749dd6ee142049f827
Explorer link: https://pudge.explorer.nervos.org/transaction/0xf45acdca6873eb9e9252580ac495d535587f77cd8ffe6f749dd6ee142049f827
Waiting for on-chain confirmation...
.Transaction committed on-chain.
Block number: 22501597 (0x15758dd)
Block hash: 0x36228cc03583a6e660dec223fc52bcf72e58ba6c6fae54bcd9250e4e4bf6349f
Class 7 execution complete.
```

---

## 🚀 Reproduction Guide

```bash
# Navigate to the week4 root
cd week4_report_builderTrack

# Run the Class 7 Duktape script
node 07_class7-advanced-duktape-examples/scripts/duktape_jsvm_demo.js
```
