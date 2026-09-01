# 🏆 Week 1 Builder Track Master Report

**Name Builder**: Riko Kurnia Sandi  
**Week Ending**: 1 September 2026

## 🌟 Executive Summary

This master report documents the comprehensive practical learning and development journey undertaken during Week 1 of the Nervos CKB Builder Track. The week focused heavily on understanding the unique generalized UTXO architecture (the Cell Model), executing on-chain scripting through local tools (OffCKB), interacting with fundamental CKB primitives (Spore DOBs, xUDT), and ultimately building a fully decentralized web application utilizing the Common Chain Connector (CCC). 

Every conceptual lesson was validated through hands-on deployment and execution on the **CKB Public Testnet (Pudge)**, providing a complete full-stack perspective on Nervos dApp engineering.

---

## 1️⃣ 01 - LearnCKB Indonesia

> 📂 **Sub-Report & Codebase**: [👉 Click here to view 01_learn-ckb Documentation](./01_learn-ckb/readme.md)  
> 🌐 **Live Web Application**: [👉 Click here to launch LearnCKB Indonesia](https://learnckb.vercel.app/)

**Objective**: Localize and adapt the comprehensive curriculum from the CKB Builder Handbook for Web3 developers in Indonesia.

- **Deployment**: We successfully deployed an interactive web platform built with Next.js and Tailwind CSS on Vercel: [👉 Click here to visit learnckb.vercel.app](https://learnckb.vercel.app/).
- **Curriculum Structuring**: The platform is organized into 3 Core Phases (Beginner, Intermediate, Advanced) and a Resource Hub. It maps out everything from local environment setup using OffCKB, CKB scripts (Lock & Type), practical on-chain transactions, Spore Digital Objects, Layer 2 networks (Fiber Network, Perun), to deep-dive architectures like the RGB++ Protocol and SSRI.
- **Key Takeaway**: Establishing a strong, accessible educational foundation for the local community by breaking down complex concepts like the Cell Model and CKB-VM into digestible, interactive modules.

---

## 2️⃣ 02 - Getting Started with CKB & OffCKB

> 📂 **Sub-Report & Codebase**: [👉 Click here to view 02_get_started_ckb Documentation](./02_get_started_ckb/readme.md)

**Objective**: Practical validation of the CKB developer environment and toolchain using OffCKB.

- **Environment Setup**: Initialized the local development toolchain using `@offckb/cli`.
- **Smart Contract Compilation**: Wrote a basic `hello-world` JavaScript smart contract. Compiled it using the CKB JavaScript VM (`ckb-js-vm`) and `esbuild` to generate the bytecode (`hello-world.bc`).
- **On-Chain Deployment**: 
  - Claimed 100k CKB from the Nervos Pudge Testnet Faucet.
  - Successfully deployed the compiled bytecode directly to the CKB Public Testnet.
  - **Transaction Hash**: [`0x1eedb40a9e1900c9d02b2d48aab414f4dd567b5e2bf683822ba1d7017bbb614a`](https://pudge.explorer.nervos.org/transaction/0x1eedb40a9e1900c9d02b2d48aab414f4dd567b5e2bf683822ba1d7017bbb614a) ➔ [🔍 Click here to inspect on CKB Explorer](https://pudge.explorer.nervos.org/transaction/0x1eedb40a9e1900c9d02b2d48aab414f4dd567b5e2bf683822ba1d7017bbb614a)
- **Key Takeaway**: Proven mastery over the `offckb` workflow, from bootstrapping a project to on-chain bytecode deployment and verification.

---

## 3️⃣ 03 - Building dApps on Nervos CKB

> 📂 **Sub-Report & Codebase**: [👉 Click here to view 03_build-dapp Master Documentation](./03_build-dapp/readme.md)

**Objective**: Hands-on implementation of core CKB dApp functionalities spanning materials 3.1 to 3.5.

This module was a deep dive into practical on-chain transactions and token standards, using `@ckb-ccc/core` to assemble and broadcast transactions off-chain:
- **3.1 Simple Transfer** — [👉 Click here for 3.1 Sub-Module](./03_build-dapp/3.1_simple-transfer/README.md) ➔ [🔍 Click here to view 3.1 Tx on Explorer](https://pudge.explorer.nervos.org/transaction/0x346797358df026210b3432366e9515c12c0872445a09ce6a5d7367e860571b2b): Demonstrated basic capacity transfers by manually resolving lock scripts, collecting live input cells, calculating change, and paying miner fees.
- **3.2 Store Data on Cell** — [👉 Click here for 3.2 Sub-Module](./03_build-dapp/3.2_store-data-on-cell/README.md) ➔ [🔍 Click here to view 3.2 Tx on Explorer](https://pudge.explorer.nervos.org/transaction/0x0861f76c027c3b9419f9372f55284022c9787e8f44e5f47a0a91af9a586d8063): Validated the CKB economic model ($1\text{ byte} = 1\text{ CKB}$) by serializing text into UTF-8 and storing it permanently in a cell's `outputsData`.
- **3.3 Create DOB (Spore)** — [👉 Click here for 3.3 Sub-Module](./03_build-dapp/3.3_create-dob/README.md) ➔ [🔍 Click here to view 3.3 Spore Tx on Explorer](https://pudge.explorer.nervos.org/transaction/0x897af8bae1e00b19630b42404786a772aac3482b54cdeaf150a333c8c6c9b2f6): Utilized `@spore-sdk/core` to mint next-generation Spore Digital Objects where 100% of the media content lives on-chain, backed intrinsically by meltable CKB capacity.
- **3.4 xUDT Fungible Token** — [👉 Click here for 3.4 Sub-Module](./03_build-dapp/3.4_xudt/README.md) ➔ [🔍 Click here to view 3.4 xUDT Tx on Explorer](https://pudge.explorer.nervos.org/transaction/0x7460cde8a0952c25b13c0727b0cad87cfb1795286ea35af2eca3b1ea4de8f612): Minted 1,000,000 Extensible User Defined Tokens (xUDT - RFC 0052), verifying the token amount serialization (128-bit unsigned integer Little-Endian) inside cell data.
- **3.5 Simple Lock Contract** — [👉 Click here for 3.5 Sub-Module](./03_build-dapp/3.5_simple-lock/README.md) ➔ [🔍 Click here to view 3.5 Contract Deployment Tx on Explorer](https://pudge.explorer.nervos.org/transaction/0x85d55b173b7f38754a48342fcb79b0740d9d8d7407b014628edcee174b82e8dd): Developed, unit-tested (10/10 passing with `ckb-testtool` & `jest`), and deployed a custom JavaScript lock script (`hash-lock.bc`) executed inside CKB-VM, breaking free from standard public-key signature limitations.

All 5 modules were executed and strictly verified via confirmed transactions on the public Testnet.

---

## 4️⃣ 04 - Common Chain Connector (CCC) Full-Stack dApp

> 📂 **Sub-Report & Codebase**: [👉 Click here to view 04_ccc_dapp Documentation](./04_ccc_dapp/readme.md)

**Objective**: Build a production-ready Web3 frontend application integrating the 5 core pillars of the CCC SDK.

- **Application Concept**: A "Decentralized On-Chain Memo Vault". Users connect their Web3 wallet to write immutable messages into CKB cell capacity. The app features a live on-chain memo feed querying the indexer in real-time.
- **The 5 CCC Core Concepts Mastered**:
  1. **Client** ([👉 Click here to inspect CccWrapper.tsx](./04_ccc_dapp/frontend/src/components/CccWrapper.tsx)): Interacting with node RPCs (`https://testnet.ckb.dev/rpc`) to poll headers and scan unspent cells.
  2. **Address** ([👉 Click here to inspect WalletProfileCard.tsx](./04_ccc_dapp/frontend/src/components/WalletProfileCard.tsx)): Manipulating Bech32m lock scripts and resolving Omnilock payloads.
  3. **Signer** ([👉 Click here to inspect Navbar.tsx](./04_ccc_dapp/frontend/src/components/Navbar.tsx)): Abstracting wallet connections (MetaMask, JoyID) to sign transactions seamlessly via Omnilock.
  4. **Cell Model** ([👉 Click here to inspect CapacityCalculator.tsx](./04_ccc_dapp/frontend/src/components/CapacityCalculator.tsx)): Calculating exact storage overheads (61 Bytes base + Payload).
  5. **Transaction** ([👉 Click here to inspect PostMemoCard.tsx](./04_ccc_dapp/frontend/src/components/PostMemoCard.tsx)): Assembling `ccc.Transaction` objects, balancing inputs/fees, and broadcasting off-chain.
- **On-Chain Proof of Work**:
  - **Memo Broadcast Tx**: [`0x1248971b3705452baa81a6e7a325d78ee11b72e0aa44feffe58283fd72d7ba60`](https://pudge.explorer.nervos.org/transaction/0x1248971b3705452baa81a6e7a325d78ee11b72e0aa44feffe58283fd72d7ba60) ➔ [🔍 Click here to inspect on CKB Explorer](https://pudge.explorer.nervos.org/transaction/0x1248971b3705452baa81a6e7a325d78ee11b72e0aa44feffe58283fd72d7ba60)
  - **Faucet Funding Tx**: [`0xd97815391010f3fdb60424872f5281f5be893b5b4e17cb383b47e8c2c55b01b3`](https://pudge.explorer.nervos.org/transaction/0xd97815391010f3fdb60424872f5281f5be893b5b4e17cb383b47e8c2c55b01b3) ➔ [🔍 Click here to inspect on CKB Explorer](https://pudge.explorer.nervos.org/transaction/0xd97815391010f3fdb60424872f5281f5be893b5b4e17cb383b47e8c2c55b01b3)
- **Frontend Execution**: Built with Next.js 16 (App Router), styled with Tailwind CSS in a bespoke "Light & Creamy" Web3 aesthetic. Successfully enabled direct MetaMask wallet interaction on Layer 1 CKB without requiring custom network RPC configuration in the wallet.

---

## 📂 Project Structure & Quick Navigation

- 📁 **`week1_report_builderTrack/`** — Current directory (Week 1 deliverables)
  - [👉 Click here to explore 01_learn-ckb](./01_learn-ckb/) — Educational platform repository & curriculum
  - [👉 Click here to explore 02_get_started_ckb](./02_get_started_ckb/) — OffCKB toolchain & bytecode deployment tests
  - [👉 Click here to explore 03_build-dapp](./03_build-dapp/) — Core dApp scripts (Transfers, Data Storage, Spore, xUDT, Custom Locks)
  - [👉 Click here to explore 04_ccc_dapp](./04_ccc_dapp/) — Full-stack Next.js web application utilizing CCC
- 📁 **`week2_report_builderTrack/`** — Upcoming directory for Week 2 deliverables
  - [👉 Click here to explore 01_rust-basic](../week2_report_builderTrack/01_rust-basic/) — Rust CKB smart contracts & scripts
  - [👉 Click here to explore 02_payment-chanel](../week2_report_builderTrack/02_payment-chanel/) — Perun & Fiber Payment Channels
