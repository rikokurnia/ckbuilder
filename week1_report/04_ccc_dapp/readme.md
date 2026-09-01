# 🌐 04 - Common Chain Connector (CCC) Full-Stack dApp

> **Decentralized On-Chain Memo Vault & Interactive Core Concepts Suite**  
> A full-stack dApp built with **Next.js 15**, **Tailwind CSS**, and **`@ckb-ccc/core`** / **`@ckb-ccc/connector-react`** that explicitly implements and visualizes all 5 foundational pillars of the Common Chain Connector protocol on Nervos CKB.

---

## 🧭 Executive Overview & Objectives

The **Common Chain Connector (CCC)** is the modern standard JavaScript/TypeScript SDK and wallet connector for the Nervos CKB ecosystem. It abstracts complex multi-chain cryptographic signatures, simplifies off-chain cell collection and fee balancing, and provides a unified interface for dApp developers.

This project delivers both a **production-ready CLI execution suite** and a **light, creamy-themed Next.js Web Frontend** to demonstrate and interact with the **5 Core Concepts** outlined in the official CCC specification:

```text
┌───────────────────────────────────────────────────────────────────────────┐
│                           CCC CORE CONCEPTS                               │
├──────────────┬──────────────┬──────────────┬──────────────┬───────────────┤
│  1. CLIENT   │  2. ADDRESS  │  3. SIGNER   │4. CELL MODEL │5. TRANSACTION │
│ (RPC & Node) │(Lock Scripts)│ (Auth & Keys)│ (State & CKB)│ (Balancing)   │
└──────────────┴──────────────┴──────────────┴──────────────┴───────────────┘
```

---

## 📊 Live On-Chain Verification Ledger

The dApp was executed and validated live on the **CKB Public Testnet (Pudge)**:

| Metric / Parameter | Value / On-Chain Record | Description |
| :--- | :--- | :--- |
| **Transaction Hash** | [`0x1248971b3705452baa81a6e7a325d78ee11b72e0aa44feffe58283fd72d7ba60`](https://pudge.explorer.nervos.org/transaction/0x1248971b3705452baa81a6e7a325d78ee11b72e0aa44feffe58283fd72d7ba60) | Live Testnet broadcast transaction |
| **Committed Block** | **Block `#22,278,072`** | Confirmed on Layer 1 |
| **Output Cell OutPoint** | `0x1248971b3705452baa81a6e7a325d78ee11b72e0aa44feffe58283fd72d7ba60:0` | Permanent memo cell reference |
| **Cell Capacity Locked** | **`134 CKB`** ($13,400,000,000\text{ Shannons}$) | Capacity backing 61B base overhead + 73B data |
| **On-Chain Payload** | `"CCC Core Concepts Demo: Client, Address, Signer, Cell Model & Transaction"` | Decoded UTF-8 String |
| **Transaction Fee** | **`0.00037309 CKB`** (37,309 Shannons) | Satisfied 1500 Shannons/KB fee rate |
| **Cycle Consumption** | `1,626,453 Cycles` (`0x18d155`) | CKB-VM SECP256K1 signature verification |

---

## 🔬 In-Depth Technical Breakdown of the 5 Core Concepts

### 1. 🌐 Concept 1: Client (`ccc.ClientPublicTestnet`)
The `Client` interface acts as the bridge between your application and the underlying CKB full nodes. It handles JSON-RPC communications, chain synchronization checks, and indexer queries:
- **Node RPC Endpoint**: `https://testnet.ckb.dev/rpc` (or custom RPC URL).
- **Tip Header Polling**: Queries the latest blockchain height dynamically via `await client.getTipHeader()`.
- **Live Cell Scanning**: Fetches unspent cells matching specific lock or type scripts using `client.findCells({ script, scriptType: "lock", scriptSearchMode: "exact" })`.

### 2. 📫 Concept 2: Address (`ccc.Address`)
In CKB, addresses are not accounts—they are human-readable Bech32m encodings of a **Lock Script**:
- **Address Format**: `ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwy0rpn3trq0sj2q6arv7xaq9w6m6xa0egxe8xvr`
- **Lock Script Structure**:
  - `codeHash`: `0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8` (Default SECP256K1 Blake160 system lock)
  - `hashType`: `"type"`
  - `args`: `0xc478c338ac607c24a06ba3678dd015dade8dd7e5` (The 20-byte Blake160 public key hash).

### 3. 🔑 Concept 3: Signer (`ccc.Signer`)
A `Signer` represents an authenticated identity capable of signing raw transaction witnesses:
- **Multi-Authenticator Support**: CCC provides a modular interface supporting WebAuthn Passkeys (**JoyID**), browser extension wallets (**OKX**, **UniSat**, **MetaMask**), Nostr (**NIP-07**), and direct private keys.
- **Direct Private Key Signer**: `new ccc.SignerCkbPrivateKey(client, privateKeyHex)` allows automated testing and devnet workflows.

### 4. 📦 Concept 4: CKB Cell Model & Storage Economics
In Nervos CKB, state storage is native to the token economy ($1\text{ byte} = 1\text{ CKB}$). Storing data on-chain requires locking sufficient capacity in the cell:

$$\text{Minimum Capacity} = \text{Base Overhead (61 Bytes)} + \text{Payload Size } (N\text{ Bytes})$$

| Cell Field | Byte Size | Explanation |
| :--- | :---: | :--- |
| **`capacity`** | 8 Bytes | 64-bit unsigned integer representing Shannons |
| **`lock.code_hash`** | 32 Bytes | Blake2b hash of the compiled lock script bytecode |
| **`lock.hash_type`** | 1 Byte | Byte indicator (`0x00` Data, `0x01` Type, `0x02` Data1, `0x04` Data2) |
| **`lock.args`** | 20 Bytes | Blake160 public key hash |
| **`type`** *(Optional)* | 0 or 65 Bytes | Optional Type Script for smart contract governance |
| **`outputsData`** | $N$ Bytes | Raw UTF-8 bytes of the memo message |
| **Total Base Overhead** | **61 Bytes** | **Minimum requirement for any basic CKB cell** |

### 5. ⚡ Concept 5: Transaction Assembly (`ccc.Transaction`)
Unlike EVM transactions which execute contracts on-chain to mutate global storage, CKB transactions are assembled entirely **off-chain**:
1. **Output Construction**: We define the desired memo cell with its capacity and hex-encoded `outputsData`.
2. **Input Collection**: `await tx.completeInputsByCapacity(signer)` automatically gathers live unspent cells owned by the signer to cover the output capacity.
3. **Fee Balancing**: `await tx.completeFeeBy(signer, 1500n)` appends a change output cell and satisfies the miner fee rate.
4. **Witness Signing & Broadcasting**: `await signer.sendTransaction(tx)` signs the transaction digest and broadcasts it to the CKB mempool.

---

## 🎨 Frontend Architecture & Light Creamy Design System

The frontend is built with a warm, elegant **Light & Creamy aesthetic** designed to avoid generic AI interfaces:
- **Color Palette**: Warm Ivory (`#FAF7F2`), Warm Cream Card (`#FFFFFF` & `#FBF8F3`), Sandstone Borders (`#EBE4D8`), Warm Amber Gold Accents (`#D97706` / `#B45309`).
- **Interactive Concept Explorer**: 5 dynamic tabs that visually dissect the live client state, address script args, active signer, capacity breakdown bar, and TypeScript code snippets.
- **Post Memo Form**: Live typing character & byte counter, real-time minimum capacity badge, outputsData hex preview, and broadcast state progress tracker.
- **Live On-Chain Memo Feed**: Directly scans the connected address's live cells on Testnet, filters printable UTF-8 messages, and provides direct links to the CKB Explorer.
- **Interactive Capacity Calculator**: Slide and customize lock script args and type scripts to dynamically calculate on-chain storage capacity.

---

## 📸 Executive Proof & Screenshot Gallery
*(Proof of work for web frontend and CLI execution will be embedded below)*

### 1. Web Frontend Interface (Light & Creamy Theme)
```
[Insert 04 Web Frontend Screenshot Here]
```

### 2. Terminal CLI Execution Output
```
[Insert 04 CLI Execution Screenshot Here]
```

---

## 🚀 Step-by-Step Execution Guide

### Option A: Running the CLI Execution Scripts
```bash
# 1. Navigate to the scripts directory
cd week1_report/04_ccc_dapp/scripts

# 2. Post a custom memo on CKB Testnet
node memo-cli.js "Hello Nervos! Demonstrating CCC Core Concepts on Testnet"

# 3. Query all live on-chain memos for your address
node query-memos.js
```

### Option B: Running the Next.js Web Frontend
```bash
# 1. Navigate to the frontend directory
cd week1_report/04_ccc_dapp/frontend

# 2. Start the local Next.js development server
pnpm dev

# 3. Open your browser at http://localhost:3000
```

---

## 🛠️ Tech Stack & Framework Matrix

```text
├── Framework:          Next.js 16.3 (App Router, Turbopack, React 19)
├── Styling:            Tailwind CSS v4 + Custom Cream Design System
├── CKB Core SDK:       @ckb-ccc/core (^1.19.1)
├── React Connector:    @ckb-ccc/connector-react (^1.1.9)
├── Icons:              lucide-react (^1.38.0)
├── Signers Supported:  JoyID (Passkey), OKX, UniSat, Raw Private Key
└── Target Network:     CKB Public Testnet (Pudge)
```
