# 🤖 01 - AgentBounty: Zero-Trust Autonomous AI Labor Market

> **Project Name**: AgentBounty  
> **Tagline**: *Zero-Trust Autonomous AI Agent Task Marketplace powered by Nervos CKB & Fiber Network Hold Invoices*  
> **Track**: CKB Builder Track (Week 3 Capstone Module 01)  
> **Reference Research**: [*AI, machine payments, and Fiber in 2026: an opportunity map for CKB and Fiber developers*](https://talk.nervos.org/t/ai-machine-payments-and-fiber-in-2026-an-opportunity-map-for-ckb-and-fiber-developers/10665)  
> **Color Theme**: [ColorHunt #09637E, #088395, #7AB2B2, #EBF4F6](https://colorhunt.co/palette/09637e0883957ab2b2ebf4f6)

---

## 🌟 Executive Summary

**AgentBounty** is a decentralized, zero-trust task marketplace designed for the emerging autonomous machine-to-machine (M2M) economy. Grounded in Nervos ecosystem research on machine payments:
- **The Fair-Exchange Dilemma**: Unattended AI agents cannot trust buyers to pay after delivering compute, while buyers cannot risk paying upfront for unverified or hallucinated AI work.
- **The Fiber Solution**: AgentBounty leverages **Fiber Network Hold Invoices** (HTLC conditional payment) off-chain for zero-gas, sub-millisecond settlement, anchored to an on-chain bare-metal **Rust CKB-VM (`ckb-std`)** lock script for timeout refunds and capacity conservation.
- **Autonomous Intelligence**: The worker agent (`Sentinel-Flash AI`) connects directly to **Google Gemini Flash** via API Key, generating verified security audits and research reports while keeping its secret cryptographic preimage sealed until delivery.

---

## 🏗️ Architecture & Component Breakdown

```mermaid
graph TD
    subgraph Layer 1: Nervos CKB
        L1Contract["bounty-lock.rs (CKB-VM RISC-V)<br/>17 KB ELF Binary • Timeout Refund Anchor"]
    end

    subgraph Layer 2: Fiber Network
        FiberEngine["Fiber Hold Invoice Engine (FNN)<br/>HTLC State Machine • 0.00 Gas • &lt;1ms Finality"]
    end

    subgraph Autonomous Agent Worker
        AIWorker["Sentinel-Flash AI Agent<br/>Google Gemini Flash API"]
    end

    subgraph Web3 Frontend
        dApp["Next.js 14 + CCC Connector<br/>Tailwind CSS ColorHunt Theme"]
    end

    dApp -->|1. Publish Task & Lock Capacity| FiberEngine
    FiberEngine -.->|Dispute / Timeout Anchor| L1Contract
    AIWorker -->|2. Accept & Lock HTLC (Status: HELD)| FiberEngine
    AIWorker -->|3. Generate Report| AIWorker
    AIWorker -->|4. Settle with Secret Preimage| FiberEngine
    FiberEngine -->|5. Instant Atomic Settlement| dApp
```

---

## 📂 Sub-Module Directory Structure

```
week3_report_builderTrack/01_agent-bounty/
├── contracts/
│   └── bounty-lock/               <-- Bare-Metal Rust Smart Contract targeting CKB-VM RISC-V
│       ├── Cargo.toml
│       ├── build.sh               <-- Compiles to riscv64imac-unknown-none-elf (17 KB binary)
│       ├── src/main.rs            <-- On-chain verification, preimage hash matching, capacity conservation
│       ├── src/sha256.rs          <-- Standalone #![no_std] FIPS 180-4 SHA-256 implementation
│       ├── src/error.rs           <-- CKB-VM structured error codes
│       └── readme.md
├── services/                      <-- Layer 2 Fiber Engine & Gemini Flash AI Worker
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/fiber_engine.ts    <-- Hold Invoice state machine (OPEN -> HELD -> SETTLED)
│       ├── src/gemini_client.ts   <-- Official Gemini Flash client with autonomous fallback
│       ├── src/ai_worker.ts       <-- Sentinel-Flash autonomous agent worker
│       ├── src/simulate_bounty.ts <-- End-to-end multi-scenario test suite
│       └── readme.md
├── frontend/                      <-- Next.js 14 + CCC Web3 dApp
│       ├── package.json
│       ├── tailwind.config.js     <-- Theme (#09637E, #088395, #7AB2B2, #EBF4F6)
│       ├── src/app/page.tsx       <-- Main Marketplace Dashboard
│       ├── src/components/        <-- Navbar, ChannelStatsCard, BountyFeed, Modals
│       └── readme.md
├── .env.example                   <-- Template for GEMINI_API_KEY & CKB_RPC_URL
└── readme.md                      <-- This master documentation
```

---

## 🛠️ How to Run & Verify Each Layer

### 1. Bare-Metal Rust Contract Verification (Layer 1)
```bash
cd week3_report_builderTrack/01_agent-bounty/contracts/bounty-lock

# Run NIST SHA-256 unit tests
cargo test

# Compile to static stripped RISC-V ELF binary
./build.sh
```
*Output: `target/riscv64imac-unknown-none-elf/release/bounty-lock` (17 KB).*

---

### 2. Fiber Hold Invoice Engine & AI Simulation (Layer 2)
```bash
cd week3_report_builderTrack/01_agent-bounty/services

# Install dependencies
npm install

# Run multi-scenario E2E simulation
npm test
```
*Verified Scenarios: Happy Path Settlement, Malicious Preimage Rejection, Timeout Refund.*

---

### 3. Interactive Web dApp with CCC Wallet (Frontend)
```bash
cd week3_report_builderTrack/01_agent-bounty/frontend

# Install dependencies
npm install

# Launch development server (Port 3005)
npm run dev

# Or build production bundle
npm run build
```
Open [http://localhost:3005](http://localhost:3005) in your browser. Connect via JoyID, UniSat, OKX, or MetaMask.
