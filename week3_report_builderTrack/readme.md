# Week 3 Builder Track Master Report

**Name Builder**: Riko Kurnia Sandi  
**Track**: CKB Builder Track  
**Focus**: Advanced Autonomous Agent Applications, Payment Channels, and Machine Economies on Nervos CKB

---

## Executive Summary

Week 3 shifts focus into **production-grade dApp engineering for the emerging Machine & AI Economy**. Grounded in recent research on machine payments and Layer 2 channels, Week 3 explores:
1. **Machine-to-Machine (M2M) Payment Protocols**: How autonomous software entities execute micro-transactions without human manual signing or conventional banking rails.
2. **Zero-Trust Fair Exchange with Fiber Network**: Utilizing **Fiber Network Hold Invoices** to eliminate counterparty risk between autonomous agents and task creators.
3. **Multi-Layer Architecture**: Harmonizing bare-metal **Rust smart contracts on CKB-VM (RISC-V)** with Layer 2 off-chain state machines and modern **Next.js 14 Web3 user interfaces powered by CCC**.

---

## 01 - AgentBounty: Autonomous AI Labor Market

> **Sub-Report & Codebase**: [View 01_agent-bounty Documentation](./01_agent-bounty/readme.md)

**Objective**: Build an autonomous AI task marketplace solving the *fair-exchange dilemma* in machine payments using Fiber Network Hold Invoices and CKB smart contracts, inspired by the Nervos 2026 Opportunity Map research.

- **On-Chain Bare-Metal Contract (`bounty-lock`)**:
  - Code: [`contracts/bounty-lock/src/main.rs`](./01_agent-bounty/contracts/bounty-lock/src/main.rs)
  - Built with `#![no_std]` and `ckb-std v1.1.0`. Compiled directly to bare-metal RISC-V (`riscv64imac-unknown-none-elf`).
  - Implements cryptographic SHA-256 preimage verification, capacity conservation invariants, and autonomous timeout refund rules.
  - Produces a static **17 KB** stripped ELF executable.
- **Layer 2 Fiber Engine & Gemini Flash AI Worker**:
  - Code: [`services/src/`](./01_agent-bounty/services/src/)
  - Real-time Hold Invoice state machine (`OPEN` $\rightarrow$ `HELD` $\rightarrow$ `SETTLED`).
  - Autonomous AI worker connected directly to **Google Gemini Flash** using API Key, producing real code security audits and research reports.
  - Instant atomic settlement with 0.00 Gas and sub-millisecond finality.
- **Next.js 14 Frontend dApp (CCC + ColorHunt Theme)**:
  - Code: [`frontend/`](./01_agent-bounty/frontend/)
  - Styled with custom ColorHunt palette (`#09637E`, `#088395`, `#7AB2B2`, `#EBF4F6`).
  - Connected to CKB Testnet using `@ckb-ccc/connector-react` (JoyID, UniSat, OKX, MetaMask).
  - Features live channel telemetry, interactive hold invoice inspector, and one-click autonomous agent deployment.

---

## Project Structure & Navigation

- **`week3_report_builderTrack/`** — Master Directory
  - [01_agent-bounty](./01_agent-bounty/) — Full-stack autonomous AI task marketplace (Rust Contract + Fiber Engine + Gemini Flash + Next.js 14 dApp)

---

## Phase 0 implementation-status note (14 September 2026)

The descriptions above are preserved as the original project record. The following corrections apply to all AgentBounty claims until the corresponding exit gates pass:

- The "Fiber Hold Invoice engine" is an **in-memory TypeScript simulation** (no FNN RPC calls, synthetic channel IDs). "Real-time," "0.00 gas," and "sub-millisecond finality" labels describe local map mutations timed with `Date.now()`, not measured network behavior.
- The `bounty-lock` tests are **two host-side SHA-256 unit tests** (`cargo test`: 2 passed). No transaction executes in CKB-VM, and the lock does not constrain payout destination/recipient or verify creator authority on refund (see `01_agent-bounty/contracts/bounty-lock/readme.md`).
- The frontend is a **simulation-labeled demonstrator**: wallet connection is real (CKB testnet), but balances, invoices, and task data are in-memory demo state.
- Tracked in `../random_things/agentbounty-improvement-plan.md` (outside this repo). Phase 0 exit requires a payment/acceptance ADR and a native two-node FNN spike before any claim of real settlement.
