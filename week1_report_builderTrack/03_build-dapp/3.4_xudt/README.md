# 🪙 3.4 - Extensible User Defined Token (xUDT)

> **Practical Implementation of Programmable Fungible Tokens on Nervos CKB using xUDT Standard (RFC 0052)**  
> Reference Documentation: [Nervos Docs - xUDT](https://docs.nervos.org/docs/dapp/xudt) & [RFC 0052: xUDT Spec](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0052-extensible-udt/0052-extensible-udt.md)

---

## 🌟 Overview
**xUDT (Extensible User Defined Token)** is the official token standard for issuing and managing fungible assets on Nervos CKB. Building upon the original Simple UDT (sUDT) standard, xUDT introduces modular extension capabilities such as rule-based governance, transfer allowances, and compliance hooks.

This module validates minting a custom xUDT fungible token supply directly on the public CKB Testnet using `@ckb-ccc/core`.

---

## 🔗 On-Chain Testnet Transaction Proof

| Parameter | Value / Details |
| :--- | :--- |
| **Network** | CKB Public Testnet (Pudge) |
| **Transaction Hash** | [`0x7460cde8a0952c25b13c0727b0cad87cfb1795286ea35af2eca3b1ea4de8f612`](https://pudge.explorer.nervos.org/transaction/0x7460cde8a0952c25b13c0727b0cad87cfb1795286ea35af2eca3b1ea4de8f612) |
| **xUDT Type Args** | `0xcd61c3a7ef0ec6542b7833d62317039a0490297bda58e01e8d28943139bcbb0f00000000` |
| **Tokens Issued** | `1,000,000 Tokens` (Uint128 LE) |
| **Block Number** | `22,277,858` (`0x153ee12`) |
| **Issuer Address** | `ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwy0rpn3trq0sj2q6arv7xaq9w6m6xa0egxe8xvr` |
| **Status** | 🟢 `committed` |
| **Explorer Link** | [View xUDT Transaction on CKB Explorer](https://pudge.explorer.nervos.org/transaction/0x7460cde8a0952c25b13c0727b0cad87cfb1795286ea35af2eca3b1ea4de8f612) |

---

## 📸 Screenshots & Proof of Work

### 1. Web Frontend UI
![xUDT Web Frontend](./images/web-fe.png)

### 2. Terminal CLI Issuance Output
![Terminal CLI Execution Output](./images/outputCli.png)

---

## 🧠 Core Technical Implementation

### 1. Token Script Identification (`xUDT Args`)
In CKB, every distinct token is identified by the hash of the Issuer's Lock Script plus flag bytes:
```typescript
const lockScript = signerAddress.script;
// xudtArgs = 32-byte Issuer Lock Hash + 4-byte extension flags (00000000 for standard plain xUDT)
const xudtArgs = lockScript.hash() + "00000000";
```

### 2. Minting xUDT Supply
Token balances on CKB are encoded as **128-bit unsigned integers in Little-Endian** format stored directly inside `outputsData`:
```typescript
import { ccc } from "@ckb-ccc/core";

// 1. Resolve official xUDT Type Script
const typeScript = await ccc.Script.fromKnownScript(
  client,
  ccc.KnownScript.XUdt,
  xudtArgs
);

// 2. Build Transaction Output
const tx = ccc.Transaction.from({
  outputs: [{ lock: lockScript, type: typeScript }],
  outputsData: [ccc.numLeToBytes(tokenAmount, 16)], // 16 bytes = 128 bits
});

// 3. Add xUDT Script Dependencies & Fund Capacity
await tx.addCellDepsOfKnownScripts(client, ccc.KnownScript.XUdt);
await tx.completeInputsByCapacity(signer);
await tx.completeFeeBy(signer, 1000);

// 4. Broadcast on-chain
const txHash = await signer.sendTransaction(tx);
```

### 3. Verification & Balance Invariant
On-chain xUDT validation enforces:
$$\sum \text{Output Token Amounts} \le \sum \text{Input Token Amounts}$$
Unless authorized by the Issuer's Lock Script, which unlocks new token minting.

---

## 🚀 How to Run

### Option A: Interactive Web UI (Parcel + React)
```bash
npm install
npm start
```
Open [http://localhost:1234](http://localhost:1234) to interact with the Token Issuer UI.

### Option B: Automated CLI Script
```bash
node scripts/execute-issue-xudt.js
```
Mints 1,000,000 xUDT tokens on CKB Testnet and queries the on-chain live cell data to verify the supply.
