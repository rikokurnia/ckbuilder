# Week 9 Builder Track Master Report: CKBHedge

**Name Builder**: Riko Kurnia Sandi  
**Date**: 2 November 2026  
**Track**: CKB Builder Track (Phase 4: Capstone Objective — Fiber Network Application)  
**Project Repository**: [https://github.com/rikokurnia/ckbhedge](https://github.com/rikokurnia/ckbhedge) *(Maintained in a separate repository)*  
**Local Objective Reference**: [`/myobjective/ckbhedge/`](../myobjective/ckbhedge/)  

---

## Executive Summary

During **Week 9** of the Nervos CKB Builder Track, work transitioned from core protocol scripting and token standards (Weeks 1–8: CKB-VM, Spore, RGB++, iCKB, and xUDT) into building an end-to-end, user-facing application: **CKBHedge**.

**CKBHedge** is a web-based, sub-second hedging and instant-swap terminal built for the **Nervos Fiber Network** ecosystem. It provides ecosystem builders, grant recipients, and active CKB holders with an emergency non-custodial safe-harbor ("panic button") and automated protection engine to protect CKB treasury funds against rapid downside market volatility without incurring L1 block confirmation delays or miner fees.

The project is hosted in its dedicated repository at [github.com/rikokurnia/ckbhedge](https://github.com/rikokurnia/ckbhedge) with the full Product Requirement Document (PRD), architectural diagrams, and responsive prototype synced in the local track workspace at [`myobjective/ckbhedge/`](../myobjective/ckbhedge/).

---

## 1. Problem Statement & Motivation (Data & Facts)

### 1.1 The Builder's Treasury Dilemma
Teams building on Nervos typically receive milestone grants, bug bounties, and hackathon disbursements denominated directly in **CKB**. While this aligns incentives with the network, it exposes operational runway to severe crypto market drawdowns:
* A 15%–30% sudden flash crash in CKB spot price can instantly jeopardize months of operational expenses (developer salaries, server hosting, and security audits).
* Currently, builders have two imperfect options during sudden market volatility:
  1. **L1 On-Chain DEX (e.g., UTXOSwap / AMM):** Subject to L1 block intervals (15–30s on CKB), solver matching queues, mempool congestion during high-volume events, and L1 transaction fees.
  2. **Centralized Exchange Transfer (CEX):** Transferring CKB to Binance or KuCoin requires waiting for L1 deposit confirmations (typically 10–20 minutes) plus CEX internal crediting. In a flash dump, slippage and price depreciation have already occurred before the sell order can be placed.

### 1.2 The Fiber Network Solution: Sub-Second Off-Chain Hedging
The **Nervos Fiber Network** brings Lightning-style, off-chain payment channels with native multi-asset support (CKB + UDTs like RUSD / stablecoins) via HTLC/PTLC routing:
* **Latency Reality:** Recent benchmark measurements across Fiber testnet environments demonstrate channel state update latencies of **0.55s – 3.17s** under network conditions, compared to tens of seconds on L1.
* **Cost Efficiency:** Off-chain balance updates within an open channel incur **0 L1 miner gas fees**.
* **Pre-funded Inbound Channel Mechanism:** While opening a channel requires an initial L1 funding transaction, once established, builders can swap their volatile CKB holdings into a pegged stablecoin (USDT/RUSD) instantaneously.

---

## 2. Product Architecture & System Design

```
+-----------------------------------------------------------------------------------+
|                            CLIENT FRONTEND (Next.js)                              |
|  - Trade / InstantSwap (CKB <-> USDT)       - Emergency 1-Click Panic Slider      |
|  - Autonomous Protection / Stop-Loss Engine - Liquidity & Channel Manager         |
+-------------------------+-----------------------------------+---------------------+
                          |                                   |
                          v                                   v
             +--------------------------+        +--------------------------+
             |   JoyID Passkey SDK      |        | @nervosnetwork/fiber-js  |
             |   (WebAuthn / FaceID)    |        | (Off-chain WASM Client)  |
             +------------+-------------+        +------------+-------------+
                          |                                   |
                          | (Session Key Delegation)          | (Off-chain Payment)
                          v                                   v
+-----------------------------------------------------------------------------------+
|                        OFF-CHAIN FIBER NETWORK (LAYER 2)                          |
|  - Multi-Asset Payment Channels (CKB + xUDT / RUSD / USDT)                        |
|  - Sub-second bilateral balance commitment updates                                |
|  - Liquidity Provider (LP) Node & RFQ Pricing Engine                              |
+-----------------------------------------------------------------------------------+
                                          |
                                          v (Final Settlement / Cooperative Close)
+-----------------------------------------------------------------------------------+
|                           NERVOS CKB BASE LAYER (L1)                              |
|  - xUDT Type Script (Stablecoin asset definition)                                 |
|  - Fiber Channel Funding, Commitment, and Settlement Lock Scripts                 |
+-----------------------------------------------------------------------------------+
```

### 2.1 Standard Smart Contracts (Nervos L1)
CKBHedge adheres strictly to official Nervos standards without deploying proprietary or unvetted smart contracts:
1. **xUDT (Extensible User Defined Token):** Standard for managing stablecoins (RUSD / bridged USDT) on CKB.
2. **Fiber Network Core Scripts:** Official Funding Cell, Commitment Cell, and Revocation/Settlement scripts from `nervosnetwork/fiber`.

### 2.2 Solving the Biometric UX Dilemma: Delegated Session Keys
JoyID's biometric authentication (FaceID/TouchID) ensures non-custodial security, but prevents background automation (e.g. executing a Stop-Loss at 3:00 AM while the user is asleep). CKBHedge introduces **Delegated Session Keys**:
* The user grants a scoped session via JoyID once (e.g., *"Allow Protection Engine to execute up to 50,000 CKB within 24 hours"*).
* An ephemeral, locally encrypted key signs off-chain Fiber channel state updates automatically when market threshold triggers are met.

---

## 3. Implementation Deliverables (Week 9)

All deliverables have been designed and implemented in the standalone repository [github.com/rikokurnia/ckbhedge](https://github.com/rikokurnia/ckbhedge) and mirrored in [`myobjective/ckbhedge/project/`](../myobjective/ckbhedge/project/):

### 3.1 Implemented Application Modules

| Module | Route | Capabilities & Implemented Features |
|---|---|---|
| **Trade & InstantSwap** | `/trade` | Two-way swap terminal between CKB and USD stablecoin; direction reversal; percentage presets (25%, 50%, 75%, 100%); slippage settings (0.1%, 0.5%, 1.0%); instant quote preview; and simulated execution. |
| **FiberSafe (Panic Button)** | `/trade` (Protect tab) | 1-Click emergency hedge slider (*"Slide to Emergency Hedge"*); immediate full-portfolio de-risking into stablecoin. |
| **Autonomous Protection** | `/trade` (Protect tab) | Conditional rules engine: Stop-Loss triggers, Trailing Stop percentages, simulated AI market sentiment indicators, execution policy toggles, spending limit caps, and session key expiry controls. |
| **Portfolio Dashboard** | `/portfolio` | Live Net Worth summary in USD & CKB; asset distribution bars; active protection badges; and recent off-chain settlement activity timeline. |
| **Channel Liquidity Manager** | `/channels` | Fiber payment channel health visualization; local capacity (CKB) vs remote capacity (USDT/RUSD); channel lifecycle dialogs (Open, Fund, and Cooperative Close). |

### 3.2 Tech Stack & Quality Standards
* **Framework:** Next.js (App Router, TypeScript, React 19)
* **Styling & System Design:** Tailwind CSS v4, custom token palettes, and accessible Radix UI primitives
* **Icons & Assets:** Lucide React, branded local token icons (`CKB`, `USDT`, `USDC`)
* **Type Safety & Build Verification:** Verified clean with `npm run typecheck` and `npm run build` with zero errors.

---

## 4. Documentation & Research Artifacts

The following foundational artifacts were created and organized during Week 9:

| Artifact | Location | Description |
|---|---|---|
| **Product Requirement Document (PRD)** | [`myobjective/ckbhedge/random/PRD.md`](../myobjective/ckbhedge/random/PRD.md) | Standard specification covering system architecture, RFQ streaming APIs, real-time WebSocket feeds, security models, and roadmap. |
| **Project README** | [`myobjective/ckbhedge/project/README.md`](../myobjective/ckbhedge/project/README.md) | Installation, developer guide, component hierarchy, and route breakdown. |
| **Visual Evidence** | [`myobjective/ckbhedge/project/artifacts/`](../myobjective/ckbhedge/project/artifacts/) | High-resolution captures of Desktop and Mobile layouts across Trade, Protect, Portfolio, and Channel workflows. |

---

## 5. Next Steps (Week 10 Transition)

1. **Fiber Testnet Node Integration:** Connect `@nervosnetwork/fiber-js` WASM client directly to the public Nervos Fiber testnet node.
2. **Live Market Data Feed:** Bind the frontend to Binance WebSocket feeds (`wss://stream.binance.com:9443/ws/ckbusdt@ticker` and `ckbusdt@kline_1m`) for live price candles and automated stop-loss evaluations.
3. **End-to-End Testnet Swap Verification:** Fund a testnet channel with faucet CKB and testnet RUSD/xUDT and record live off-chain settlement proofs.
