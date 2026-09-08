# 💳 02 - Payment Channels on Nervos CKB

**Name Builder**: Riko Kurnia Sandi  
**Week**: Week 2 (Lesson 10)  
**Track**: CKB Builder Track

---

## 🧭 Executive Overview

Nervos CKB is architecturally separated into **Layer 1 (L1: Common Knowledge Base)** and **Layer 2 (L2: Off-Chain Scaling)**. 
- **Layer 1** focuses on maximal decentralization, proof-of-work security, and immutable state verification via the **Cell Model**.
- **Layer 2** scales transactional bandwidth to unlimited throughput and near-zero latency by performing state transitions off-chain in peer-to-peer payment channels, anchoring only the final settlement back to Layer 1.

On CKB, the two premier payment channel solutions are:
1. **Fiber Network**: A high-performance, Lightning Network-compatible P2P payment channel network supporting both native CKB and user-defined tokens (sUDT / xUDT).
2. **Perun Network**: An Ethereum-compatible, generalized state channel framework enabling multi-party virtual channels and atomic cross-chain swaps.

---

## 📂 Sub-Modules & Quick Navigation

| Sub-Module | Focus Area | Technology | Status | Sub-Report Link |
| :--- | :--- | :--- | :---: | :--- |
| **01 - Fiber Basic** | Lightning-Compatible Payment Channels & Multi-Hop HTLCs | P2P Channels, 2-of-2 Multisig Cell, HTLC Routing | 🟢 **Complete** | [👉 Click here to explore fiber-basic](./fiber-basic/readme.md) |
| **02 - Perun Basic** | Generalized State Channels & Cross-Chain Swaps | Virtual Channels, Multi-Party State | 🟡 **Next Up** | [👉 Click here to explore perun-basic](./perun-basic/readme.md) |

---

## 🔬 High-Level Architecture: Layer 1 vs. Layer 2

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                 Nervos CKB Modular Scaling Architecture                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ⚡ LAYER 2: Payment & State Channels (Off-Chain Execution)                │
│   ├── Fiber Network (Lightning P2P micropayments, HTLC routing, Multi-token)│
│   └── Perun Network (Generalized state transitions, virtual channels)       │
│                               ▲                                             │
│               Off-Chain P2P   │   Sub-second Finality / 0 L1 Gas            │
│               State Exchange  │   Cryptographic Revocation Keys             │
│                               ▼                                             │
│   🛡️ LAYER 1: Nervos CKB (On-Chain Verification & Settlement)               │
│   ├── 2-of-2 Multisig Channel Funding Cells                                 │
│   ├── Dispute Resolution & Watchtower Justice Branches                      │
│   └── Cooperative Closing & Net Capacity Payout                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Comparative Technology Matrix

| Metric / Dimension | Layer 1 (Direct CKB) | Fiber Network (L2) | Perun Network (L2) | Bitcoin Lightning |
| :--- | :--- | :--- | :--- | :--- |
| **Transaction Speed** | Block time (~8–24s) | **Sub-second (< 100ms)** | **Sub-second (< 100ms)** | Sub-second (< 500ms) |
| **Fee Cost** | Miner Fee (per byte) | **Zero Fee between peers** | **Zero Fee between peers** | Routing base fee |
| **Throughput (TPS)** | Base L1 capacity | **Unlimited (Scales with nodes)** | **Unlimited** | Unlimited |
| **Asset Support** | Native CKB, xUDT, Spores | **Native CKB + sUDT / xUDT** | **Multi-asset (CKB + EVM)** | BTC only |
| **Smart Contract Capability** | RISC-V CKB-VM | **HTLC / PTLC Routing** | **Generalized Turing-Complete Apps** | Script (Limited) |
| **On-Chain Footprint** | Every single transfer | **2 Transactions (Open & Close)**| **2 Transactions (Open & Close)**| 2 Transactions |

---

## 🚀 Getting Started

Explore the detailed sub-modules:
- [👉 Click here to view the Fiber Network Report & Simulation](./fiber-basic/readme.md)
- [👉 Click here to view the Perun Network Report](./perun-basic/readme.md)
