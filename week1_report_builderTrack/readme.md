# 🏆 Week 1 Builder Track Master Report

**Name Builder**: Riko Kurnia Sandi  
**Week Ending**: 1 September 2026

## 🌟 Executive Summary

This master report documents the comprehensive practical learning and development journey undertaken during Week 1 of the Nervos CKB Builder Track. The week focused heavily on understanding the unique generalized UTXO architecture (the Cell Model), executing on-chain scripting through local tools (OffCKB), interacting with fundamental CKB primitives (Spore DOBs, xUDT), and ultimately building a fully decentralized web application utilizing the Common Chain Connector (CCC). 

Every conceptual lesson was validated through hands-on deployment and execution on the **CKB Public Testnet (Pudge)**, providing a complete full-stack perspective on Nervos dApp engineering.

---

## 1️⃣ [01 - LearnCKB Indonesia](./01_learn-ckb/readme.md)

**Objective**: Localize and adapt the comprehensive curriculum from the CKB Builder Handbook for Web3 developers in Indonesia.

- **Deployment**: We successfully deployed an interactive web platform built with Next.js and Tailwind CSS on Vercel: [LearnCKB Indonesia](https://learnckb.vercel.app/).
- **Curriculum Structuring**: The platform is organized into 3 Core Phases (Beginner, Intermediate, Advanced) and a Resource Hub. It maps out everything from local environment setup using OffCKB, CKB scripts (Lock & Type), practical on-chain transactions, Spore Digital Objects, Layer 2 networks (Fiber Network, Perun), to deep-dive architectures like the RGB++ Protocol and SSRI.
- **Key Takeaway**: Establishing a strong, accessible educational foundation for the local community by breaking down complex concepts like the Cell Model and CKB-VM into digestible, interactive modules.

---

## 2️⃣ [02 - Getting Started with CKB & OffCKB](./02_get_started_ckb/readme.md)

**Objective**: Practical validation of the CKB developer environment and toolchain using OffCKB.

- **Environment Setup**: Initialized the local development toolchain using `@offckb/cli`.
- **Smart Contract Compilation**: Wrote a basic `hello-world` JavaScript smart contract. Compiled it using the CKB JavaScript VM (`ckb-js-vm`) and `esbuild` to generate the bytecode (`hello-world.bc`).
- **On-Chain Deployment**: 
  - Claimed 100k CKB from the Nervos Pudge Testnet Faucet.
  - Successfully deployed the compiled bytecode directly to the CKB Public Testnet.
  - **Transaction Hash**: [`0x1eedb40a9e1900c9d02b2d48aab414f4dd567b5e2bf683822ba1d7017bbb614a`](https://pudge.explorer.nervos.org/transaction/0x1eedb40a9e1900c9d02b2d48aab414f4dd567b5e2bf683822ba1d7017bbb614a)
- **Key Takeaway**: Proven mastery over the `offckb` workflow, from bootstrapping a project to on-chain bytecode deployment and verification.

---

## 3️⃣ [03 - Building dApps on Nervos CKB](./03_build-dapp/readme.md)

**Objective**: Hands-on implementation of core CKB dApp functionalities spanning materials 3.1 to 3.5.

This module was a deep dive into practical on-chain transactions and token standards, using `@ckb-ccc/core` to assemble and broadcast transactions off-chain:
- **3.1 Simple Transfer**: Demonstrated basic capacity transfers by manually resolving lock scripts, collecting live input cells, calculating change, and paying miner fees.
- **3.2 Store Data on Cell**: Validated the CKB economic model ($1\text{ byte} = 1\text{ CKB}$) by serializing text into UTF-8 and storing it permanently in a cell's `outputsData`.
- **3.3 Create DOB (Spore)**: Utilized `@spore-sdk/core` to mint next-generation Spore Digital Objects where 100% of the media content lives on-chain, backed intrinsically by meltable CKB capacity.
- **3.4 xUDT Fungible Token**: Minted 1,000,000 Extensible User Defined Tokens (xUDT - RFC 0052), verifying the token amount serialization (128-bit unsigned integer Little-Endian) inside cell data.
- **3.5 Simple Lock Contract**: Developed, unit-tested (10/10 passing with `ckb-testtool` & `jest`), and deployed a custom JavaScript lock script (`hash-lock.bc`) executed inside CKB-VM, breaking free from standard public-key signature limitations.

All 5 modules were executed and strictly verified via confirmed transactions on the public Testnet.

---

## 4️⃣ [04 - Common Chain Connector (CCC) Full-Stack dApp](./04_ccc_dapp/readme.md)

**Objective**: Build a production-ready Web3 frontend application integrating the 5 core pillars of the CCC SDK.

- **Application Concept**: A "Decentralized On-Chain Memo Vault". Users connect their Web3 wallet to write immutable messages into CKB cell capacity. The app features a live on-chain memo feed querying the indexer in real-time.
- **The 5 CCC Core Concepts Mastered**:
  1. **Client**: Interacting with node RPCs (`https://testnet.ckb.dev/rpc`) to poll headers and scan unspent cells.
  2. **Address**: Manipulating Bech32m lock scripts and resolving Omnilock payloads.
  3. **Signer**: Abstracting wallet connections (MetaMask, JoyID) to sign transactions seamlessly via Omnilock.
  4. **Cell Model**: Calculating exact storage overheads (61 Bytes base + Payload).
  5. **Transaction**: Assembling `ccc.Transaction` objects, balancing inputs/fees, and broadcasting off-chain.
- **Frontend Execution**: Built with Next.js 16 (App Router), styled with Tailwind CSS in a bespoke "Light & Creamy" Web3 aesthetic. Successfully enabled direct MetaMask wallet interaction on Layer 1 CKB without requiring custom network RPC configuration in the wallet.

---

## 📂 Project Structure & Navigation

- **`week1_report_builderTrack/`** - Current directory (Week 1 deliverables)
  - `/01_learn-ckb/` - Educational platform repository
  - `/02_get_started_ckb/` - OffCKB local deployment tests
  - `/03_build-dapp/` - Core dApp scripts (Transfers, Data Storage, Spore, xUDT, Custom Locks)
  - `/04_ccc_dapp/` - Full-stack Next.js web application utilizing CCC
- **`week2_report_builderTrack/`** - Upcoming directory for Week 2 deliverables (Rest of the modules)
  - `/01_rust-basic/` - Rust CKB smart contracts & scripts
  - `/02_payment-chanel/` - Perun & Fiber Payment Channels
