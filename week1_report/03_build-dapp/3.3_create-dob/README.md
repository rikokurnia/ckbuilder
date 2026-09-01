# 🎨 3.3 - Create Digital Object (Spore Protocol DOB)

> **Practical Implementation of Digital Object (DOB) Minting on Nervos CKB using Spore Protocol**  
> Reference Documentation: [Spore Protocol on CKB](https://docs.spore.pro/) & [Nervos DOBs](https://docs.nervos.org/docs/dapp/create-dob)

---

## 🌟 Overview
**Spore Protocol** introduces a next-generation standard for **Digital Objects (DOBs)** on Nervos CKB. Unlike traditional NFTs that store media off-chain (e.g., on centralized servers or IPFS gateways), Spore DOBs store their full content **100% on-chain**, backed intrinsically by CKB cell capacity.

Each Spore DOB is **valuable by design** because its storage capacity is funded with real CKB tokens. If a holder no longer wants the DOB, they can melt (burn) it at any time to **reclaim 100% of the underlying CKB**.

---

## 🔗 On-Chain Testnet Transaction Proof

| Parameter | Value / Details |
| :--- | :--- |
| **Network** | CKB Public Testnet (Pudge) |
| **Transaction Hash** | [`0x897af8bae1e00b19630b42404786a772aac3482b54cdeaf150a333c8c6c9b2f6`](https://pudge.explorer.nervos.org/transaction/0x897af8bae1e00b19630b42404786a772aac3482b54cdeaf150a333c8c6c9b2f6) |
| **Spore DOB ID** | `0x1a3c483c4f1fa77f6d49d728bd38dc0d9bb31e8a35d8a7798dc07a8e24c07524` |
| **Block Number** | `22,277,829` (`0x153edf5`) |
| **Content Type** | `application/json` (Genesis DOB metadata) |
| **Creator Address** | `ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwy0rpn3trq0sj2q6arv7xaq9w6m6xa0egxe8xvr` |
| **Status** | 🟢 `committed` |
| **Explorer Link** | [View on CKB Explorer](https://pudge.explorer.nervos.org/transaction/0x897af8bae1e00b19630b42404786a772aac3482b54cdeaf150a333c8c6c9b2f6) |

---

## 📸 Screenshots & Proof of Work
*(Add manual screenshot evidence below)*

### 1. Web Frontend UI
```
[Insert Spore DOB Web Frontend Screenshot Here]
```

### 2. Terminal CLI Minting Output
```
[Insert Terminal CLI Execution Output Screenshot Here]
```

### 3. Explorer On-Chain Spore Verification
```
[Insert Explorer Spore Transaction View Screenshot Here]
```

---

## 🧠 Core Technical Implementation

### 1. Spore SDK Initialization & Testnet Config
```typescript
import { setSporeConfig, createSpore, predefinedSporeConfigs } from "@spore-sdk/core";

const sporeConfig = {
  ...predefinedSporeConfigs.Testnet,
  ckbNodeUrl: "https://testnet.ckb.dev",
  ckbIndexerUrl: "https://testnet.ckb.dev",
};

setSporeConfig(sporeConfig);
```

### 2. Minting a Digital Object (DOB)
```typescript
const { txSkeleton, outputIndex } = await createSpore({
  data: {
    contentType: "application/json",
    content: Buffer.from(JSON.stringify({
      dna: "CKBuilder-Week1-SporeDOB",
      symbol: "DOB#1",
      attributes: { type: "Genesis", builder: "RikoKurnia" },
    })),
  },
  toLock: wallet.lock,
  fromInfos: [wallet.address],
  config: sporeConfig,
});

const txHash = await wallet.signAndSendTransaction(txSkeleton);
```

### 3. Key Properties of Spore DOBs:
- **Zero Loss / Meltable**: Anyone can melt their Spore to get back the CKB tokens locked in the cell.
- **Immutable On-Chain Heritage**: Media content is cryptographically tied to the Spore's Type ID and permanently preserved on Layer 1.
- **Cluster Hierarchy**: Spores can optionally belong to a parent Cluster (Collection standard).

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
node scripts/execute-create-dob.mjs
```
Mints a live Spore DOB on CKB Testnet, extracts the unique `Spore ID`, and logs the explorer link.
