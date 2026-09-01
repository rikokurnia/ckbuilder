# 💾 3.2 - Store Data on Cell dApp

> **Practical Implementation of On-Chain State Storage on Nervos CKB Cells**  
> Reference Tutorial: [Nervos Docs - Store Data on Cell](https://docs.nervos.org/docs/dapp/store-data-on-cell)

---

## 🌟 Overview
In the Nervos CKB **Cell Model**, cells do not just hold balances—they act as decentralized state containers. Any arbitrary binary data (strings, serialized objects, smart contract states) can be stored directly in a Cell's `data` field.

This module validates writing custom data to a live Cell on the public CKB Testnet and reading it back via RPC using Common Chain Connector (**CCC**).

---

## 🔗 On-Chain Testnet Transaction Proof

| Parameter | Value / Details |
| :--- | :--- |
| **Network** | CKB Public Testnet (Pudge) |
| **Transaction Hash** | [`0x0861f76c027c3b9419f9372f55284022c9787e8f44e5f47a0a91af9a586d8063`](https://pudge.explorer.nervos.org/transaction/0x0861f76c027c3b9419f9372f55284022c9787e8f44e5f47a0a91af9a586d8063) |
| **Block Number** | `22,271,894` (`0x153d796`) |
| **Stored Text Data** | `"Hello Nervos CKB! Data stored on Cell by CKBuilder Week 1."` |
| **Hex Encoded Data** | `0x48656c6c6f204e6572766f7320434b422120446174612073746f726564206f6e2043656c6c20627920434b4275696c646572205765656b20312e` |
| **Allocated Cell Capacity** | `119 CKB` (61 bytes cell header + 58 bytes string payload) |
| **Status** | 🟢 `committed` |
| **Explorer Link** | [View on CKB Explorer](https://pudge.explorer.nervos.org/transaction/0x0861f76c027c3b9419f9372f55284022c9787e8f44e5f47a0a91af9a586d8063) |

---

## 📸 Screenshots & Proof of Work
*(Add manual screenshot evidence below)*

### 1. Web Frontend UI
```
[Insert Store Data Web Frontend Screenshot Here]
```

### 2. Terminal CLI Execution Output
```
[Insert Terminal CLI Execution Output Screenshot Here]
```

### 3. Explorer On-Chain Data Verification
```
[Insert Explorer On-Chain Data View Screenshot Here]
```

---

## 🧠 Core Technical Implementation

### 1. Writing Data to a Cell
To store data, the string is UTF-8 encoded into bytes and placed into the transaction's `outputsData` array:

```typescript
import { ccc } from "@ckb-ccc/core";

// 1. Encode text string to Hex bytes
const encoder = new TextEncoder();
const dataHex = "0x" + Buffer.from(encoder.encode("Hello Nervos CKB!")).toString("hex");

// 2. Build Transaction with outputsData
const tx = ccc.Transaction.from({
  outputs: [{ lock: signerAddress.script }],
  outputsData: [dataHex],
});

// 3. Automatically complete inputs for cell capacity & network fee
await tx.completeInputsByCapacity(signer);
await tx.completeFeeBy(signer, 1000);

// 4. Send transaction
const txHash = await signer.sendTransaction(tx);
```

### 2. State Rent & Cell Storage Economics
- **1 Byte of On-Chain Storage = 1 CKB Capacity**.
- A cell with 58 bytes of data requires:
  - 8 bytes (`capacity`) + 32 bytes (`code_hash`) + 1 byte (`hash_type`) + 20 bytes (`args`) = **61 bytes** minimum cell overhead.
  - 61 bytes overhead + 58 bytes payload = **119 bytes** total $\rightarrow$ **119 CKB** capacity required.
- When the data is no longer needed, the cell can be consumed (destroyed) in a future transaction to **reclaim 100% of the locked CKB capacity**.

### 3. Reading Live Data Back from the Blockchain
```typescript
const liveCell = await client.getCellLive({ txHash, index: "0x0" }, true);
if (liveCell) {
  const decoder = new TextDecoder("utf-8");
  const storedString = decoder.decode(Buffer.from(liveCell.outputData.slice(2), "hex"));
  console.log("Retrieved Data:", storedString);
}
```

---

## 🚀 How to Run

### Option A: Interactive Web UI (Parcel + React)
```bash
npm install
npm start
```
Open [http://localhost:1234](http://localhost:1234) in your browser.

### Option B: Automated CLI Script
```bash
node scripts/execute-store-data.js
```
Stores the on-chain message, waits for block confirmation, and immediately reads back the verified string from the live cell.
