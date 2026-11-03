# 💸 3.1 - Simple Transfer dApp

> **Practical Implementation of CKB Token Transfers using Common Chain Connector (CCC)**  
> Reference Tutorial: [Nervos Docs - Transfer CKB](https://docs.nervos.org/docs/dapp/transfer-ckb)

---

## 🌟 Overview
This module demonstrates how to construct, sign, and broadcast native CKB token transfer transactions on Nervos Network using `@ckb-ccc/core`. It provides both an interactive web application and a CLI automated test runner.

---

## 🔗 On-Chain Testnet Transaction Proof

| Parameter | Value / Details |
| :--- | :--- |
| **Network** | CKB Public Testnet (Pudge) |
| **Transaction Hash** | [`0x346797358df026210b3432366e9515c12c0872445a09ce6a5d7367e860571b2b`](https://pudge.explorer.nervos.org/transaction/0x346797358df026210b3432366e9515c12c0872445a09ce6a5d7367e860571b2b) |
| **Block Number** | `22,271,765` (`0x153d715`) |
| **Sender Address** | `ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwy0rpn3trq0sj2q6arv7xaq9w6m6xa0egxe8xvr` |
| **Amount Transferred** | `100 CKB` |
| **Status** | 🟢 `committed` |
| **Explorer Link** | [View on CKB Explorer](https://pudge.explorer.nervos.org/transaction/0x346797358df026210b3432366e9515c12c0872445a09ce6a5d7367e860571b2b) |

---

## 📸 Screenshots & Proof of Work

### 1. Web Frontend UI
![Simple Transfer Web Frontend](./images/web-fe.png)

### 2. Terminal CLI Transfer Output
![Terminal CLI Execution Output](./images/cliOutput.png)

---

## 🧠 Core Technical Implementation

### 1. Transaction Construction with CCC
The transaction creates an output cell with the recipient's lock script and desired capacity:

```typescript
import { ccc } from "@ckb-ccc/core";

// 1. Resolve recipient address to Lock Script
const { script: toLock } = await ccc.Address.fromString(toAddress, client);

// 2. Build Transaction with destination output
const tx = ccc.Transaction.from({
  outputs: [{ 
    lock: toLock, 
    capacity: ccc.fixedPointFrom(amountInCKB) 
  }],
  outputsData: ["0x"],
});

// 3. Automatically collect UTXOs (inputs) and calculate transaction fee
await tx.completeInputsByCapacity(signer);
await tx.completeFeeBy(signer, 1000);

// 4. Sign and broadcast to the network
const txHash = await signer.sendTransaction(tx);
```

### 2. Capacity & Shannon Conversion
In CKB:
- `1 CKB = 100,000,000 Shannons` (`10^8`).
- `ccc.fixedPointFrom(amount)` cleanly handles conversion between human-readable CKB decimal strings and on-chain Shannon values.

---

## 🚀 How to Run

### Option A: Interactive Web UI (Parcel + React)
```bash
npm install
npm start
```
Open [http://localhost:1234](http://localhost:1234) to interact with the wallet UI in your browser.

### Option B: Automated CLI Script
```bash
node scripts/execute-transfer.js
```
Runs the automated transfer flow and confirms the on-chain status directly in the terminal.
