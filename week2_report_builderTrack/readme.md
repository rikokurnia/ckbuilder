# 🏆 Week 2 Builder Track Master Report

**Name Builder**: Riko Kurnia Sandi  
**Week Ending**: 8 September 2026  
**Track**: CKB Builder Track

---

## 🌟 Executive Summary

This master report synthesizes the practical engineering and research completed during **Week 2** of the Nervos CKB Builder Track. Building upon the Cell Model fundamentals and TypeScript/CCC dApp engineering established in Week 1, Week 2 shifts focus into:
1. **Intensive Bare-Metal Smart Contract Development in Rust (Lesson 8)**: Writing low-level, high-performance, memory-safe smart contracts targeting the **CKB-VM (RISC-V)** using `ckb-std`, paired with administrative toolchain operations via **CKB-CLI v2.0.0** and off-chain async Rust RPC querying.
2. **Layer 2 Payment Channels & Off-Chain Scaling on CKB (Lesson 10)**: Scaling CKB transaction throughput to unlimited capacity and sub-second finality through **Fiber Network** (Lightning Network-compatible, multi-token P2P channels) and **Perun Network** (generalized multi-party state channels and cross-chain interoperability).

---

## 1️⃣ 01 - Intensive Smart Contract Development with Rust & CKB-CLI

> 📂 **Sub-Report & Codebase**: [👉 Click here to view 01_rust-basic Documentation](./01_rust-basic/readme.md)

**Objective**: Master bare-metal CKB smart contract engineering using Rust (`no_std`), compile to bare-metal RISC-V ELF binaries, query the network with asynchronous Rust, and manage accounts and on-chain state via CKB-CLI.

- **On-Chain Smart Contract (`simple-guard`)**:
  - Code: [`contracts/simple-guard/src/main.rs`](./01_rust-basic/contracts/simple-guard/src/main.rs)
  - Built with `#![no_std]` and `ckb-std v1.1.0`. Compiled directly to the bare-metal target `riscv64imac-unknown-none-elf` using `clang`.
  - Implements on-chain invariant validation: loads executing script and args (`load_script`), fetches transaction hash (`load_tx_hash`), and enforces capacity conservation rules (`QueryIter` on inputs and outputs).
  - Produces an ultra-compact **13 KB** static RISC-V ELF executable (`target/riscv64imac-unknown-none-elf/release/simple-guard`).
- **Off-Chain Rust RPC Client (`ckb-client`)**:
  - Code: [`client/ckb-client/src/main.rs`](./01_rust-basic/client/ckb-client/src/main.rs)
  - Async Rust CLI utilizing `tokio` and `reqwest` connecting to the CKB Testnet (`https://testnet.ckb.dev/rpc`).
  - Successfully queried live network parameters: Tip Block `#22,345,676`, Epoch `#13,785`, and chain consensus info.
- **CKB-CLI Toolchain Operations (`ckb-cli v2.0.0`)**:
  - Scripts: [`ckb-cli-scripts/`](./01_rust-basic/ckb-cli-scripts/)
  - Tested account derivation, tip header queries, and live wallet capacity inspection.
  - Inspected live testnet balance (`4,999.99999167 CKB`) and live memo state cells from Week 1.

---

## 2️⃣ 02 - Payment Channels on Nervos CKB

> 📂 **Sub-Report & Codebase**: [👉 Click here to view 02_payment-chanel Documentation](./02_payment-chanel/readme.md)

**Objective**: Research and validate Layer 2 scaling protocols on CKB, comparing payment channels against base-layer verification economics, and implementing runnable simulations of channel lifecycles.

### Sub-Module A: Fiber Network (Lightning on CKB)
> 📂 **Fiber Sub-Report**: [👉 Click here to explore fiber-basic](./02_payment-chanel/fiber-basic/readme.md)

- **Key Highlights**:
  - Lightning Network-compatible P2P payment network built natively on CKB.
  - Uniquely supports **multi-asset payment channels** (routing native CKB as well as fungible tokens like sUDT / xUDT).
  - Implemented an interactive TypeScript simulation suite ([`fiber_simulation.ts`](./02_payment-chanel/fiber-basic/scripts/src/fiber_simulation.ts)) covering:
    1. Channel Handshake & Capacity Negotiation (1,000 CKB Alice, 500 CKB Bob).
    2. Layer 1 Funding Cell generation with 2-of-2 multisig lock script.
    3. Off-chain zero-gas micropayment streams with revocation key generation.
    4. Multi-hop HTLC routing using cryptographic preimage verification.
    5. Watchtower fraud detection with automatic revocation penalty execution.
    6. Clean cooperative channel settlement onto Layer 1.

### Sub-Module B: Perun Network (Generalized State Channels)
> 📂 **Perun Sub-Report**: [👉 Click here to explore perun-basic](./02_payment-chanel/perun-basic/readme.md)

- **Key Highlights**:
  - Academic-grade, generalized state channel framework enabling arbitrary off-chain smart contract execution (App Channels).
  - Multi-party channel capability ($N \ge 2$) and instant **Virtual Channels** routed through intermediaries without L1 involvement.
  - Protocol-agnostic architecture enabling cross-chain atomic state channels between **Nervos CKB** and **Ethereum**.
  - Implemented an interactive TypeScript simulation suite ([`perun_simulation.ts`](./02_payment-chanel/perun-basic/scripts/src/perun_simulation.ts)) verifying:
    1. Multi-party channel initialization anchored to a CKB Channel Cell.
    2. Off-chain virtual channel instantiation.
    3. Generalized state transitions signed by all participants.
    4. Two-phase dispute handling (Register vs. Refute vs. Finalize).
    5. Final Layer 1 settlement payout preserving 100% of capacity.

---

## 📂 Project Structure & Quick Navigation

- 📁 **`week2_report_builderTrack/`** — Master Directory
  - [👉 Click here to explore 01_rust-basic](./01_rust-basic/) — Bare-metal Rust CKB contract, CKB-CLI toolchain, and async RPC client
  - [👉 Click here to explore 02_payment-chanel](./02_payment-chanel/) — Master Payment Channels report & comparative scaling matrix
    - [👉 Click here to explore fiber-basic](./02_payment-chanel/fiber-basic/) — Fiber Network Lightning-compatible payment channels & HTLC simulation
    - [👉 Click here to explore perun-basic](./02_payment-chanel/perun-basic/) — Perun generalized state channels & dispute resolution simulation
