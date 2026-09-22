# 🏆 Week 4 Builder Track Master Report (Part 1: Classes 1 – 5)

**Name Builder**: Riko Kurnia Sandi  
**Track**: CKB Builder Track  
**Focus**: CKB Script Development Course (Validation Model, Script Basics, sUDT, WebAssembly on CKB, and Debugging / Cycle Profiling)

---

## 🌟 Executive Summary

This master report documents the practical execution, theoretical synthesis, and live on-chain testnet verification for **Week 4 (Intermediate Section)** of the *CKB Builder Handbook*. 

Week 4 marks the transition from basic dApp integrations to deep, bare-metal **CKB Script Development**. The first half of the course focuses on:
1. **The CKB-VM Validation Model (Class 1)**: Contrasting CKB's off-chain computation / on-chain verification paradigm against traditional EVM execution models, and enforcing the separation between Lock Scripts (authentication) and Type Scripts (state invariants).
2. **Script Anatomy & Resolution (Class 2)**: Analyzing `code_hash`, `hash_type` (`data` vs `type` / Type ID), dynamic `args` parameterization, `cell_deps` resolution, and RISC-V syscalls.
3. **User Defined Tokens (Class 3)**: Implementing the official Simple UDT standard (sUDT - RFC 0025) as first-class token citizens, serializing 128-bit unsigned integers in little-endian format, and validating issuance invariants.
4. **WebAssembly on CKB (Class 4)**: Exploring the execution of WebAssembly (.wasm) runtimes inside the RISC-V CKB-VM, language interoperability, and on-chain bytecode commitment.
5. **Debugging & Cycle Profiling (Class 5)**: Mastering the CKB debugging toolchain via offline mock transaction dumps (`ckb-debugger`), deterministic exit codes, and on-chain cycle consumption profiling.

Every single class was verified with a live transaction broadcasted and committed on the **CKB Public Testnet (Pudge)**.

---

## 📊 On-Chain Verification Summary Matrix (Classes 1 – 5)

| Class / Module | Focus / Primitive | Transaction Hash | Block Number | Status |
| :--- | :--- | :--- | :---: | :---: |
| **01 - Validation Model** | Lock vs. Type Script separation, state cell storage | [`0x9b8d39639d...2ea863`](https://pudge.explorer.nervos.org/transaction/0x9b8d39639d6a70064f13a609f3a7a81bba460b25ec8cd707afb53292a42ea863) | `#22,499,978` | 🟢 Committed |
| **02 - Script Basics** | Parameterized `args` (`0xc0c0`), cell deps | [`0x2e49f3e728...cb72a4`](https://pudge.explorer.nervos.org/transaction/0x2e49f3e728d804823e0b2d8dd69eebfb954b3fb395cc7dae3689c36a19cb72a4) | `#22,501,010` | 🟢 Committed |
| **03 - sUDT Tokens** | Minted 10,000,000 sUDT tokens (`u128` LE) | [`0x11814b0e26...96d6f0`](https://pudge.explorer.nervos.org/transaction/0x11814b0e26806983e5fe5bee4f7824ef2094fb08e57c1f880af15fd25796d6f0) | `#22,501,025` | 🟢 Committed |
| **04 - WASM on CKB** | Committed 41-byte WASM validation bytecode | [`0xe5280ff02e...78f50`](https://pudge.explorer.nervos.org/transaction/0xe5280ff02e2a7f73d8953b34968a07ec7f14640b6bc390c8fcaa4be599478f50) | `#22,501,034` | 🟢 Committed |
| **05 - Debugging** | Mock tx dump export, 1.64M cycle profiling | [`0xf56963da6c...0c26c`](https://pudge.explorer.nervos.org/transaction/0xf56963da6ce4d7c0a20c22cc1d2d3fc264c76cda4501cd12f4b957ca0bf0c26c) | `#22,501,048` | 🟢 Committed |

---

## 📂 Sub-Module Documentation & Deliverables

### 1️⃣ [01 - Validation Model](./01_class1-validation-model/readme.md)
- **Concepts**: Off-chain computation, on-chain validation, Lock Script authentication, Type Script invariant enforcement.
- **Code**: [`validation_model_demo.js`](./01_class1-validation-model/scripts/validation_model_demo.js)
- **Tx Hash**: [`0x9b8d39639d6a70064f13a609f3a7a81bba460b25ec8cd707afb53292a42ea863`](https://pudge.explorer.nervos.org/transaction/0x9b8d39639d6a70064f13a609f3a7a81bba460b25ec8cd707afb53292a42ea863)

### 2️⃣ [02 - Script Basics](./02_class2-script-basics/readme.md)
- **Concepts**: Anatomy of `code_hash`, `hash_type` (`data` vs `type`), dynamic `args` parameterization, and `cell_deps`.
- **Code**: [`script_basics_demo.js`](./02_class2-script-basics/scripts/script_basics_demo.js)
- **Tx Hash**: [`0x2e49f3e728d804823e0b2d8dd69eebfb954b3fb395cc7dae3689c36a19cb72a4`](https://pudge.explorer.nervos.org/transaction/0x2e49f3e728d804823e0b2d8dd69eebfb954b3fb395cc7dae3689c36a19cb72a4)

### 3️⃣ [03 - User Defined Tokens (sUDT)](./03_class3-udt/readme.md)
- **Concepts**: sUDT specification (RFC 0025), first-class tokens inside cells, owner lock hash as token ID, 16-byte little-endian amount encoding.
- **Code**: [`issue_udt_demo.js`](./03_class3-udt/scripts/issue_udt_demo.js)
- **Tx Hash**: [`0x11814b0e26806983e5fe5bee4f7824ef2094fb08e57c1f880af15fd25796d6f0`](https://pudge.explorer.nervos.org/transaction/0x11814b0e26806983e5fe5bee4f7824ef2094fb08e57c1f880af15fd25796d6f0)

### 4️⃣ [04 - WebAssembly on CKB](./04_class4-webassembly-on-ckb/readme.md)
- **Concepts**: Running WASM interpreters (Wasm3) on RISC-V CKB-VM, multi-language contract authoring, cycle economics, and bytecode commitment.
- **Code**: [`wasm_runtime_demo.js`](./04_class4-webassembly-on-ckb/scripts/wasm_runtime_demo.js)
- **Tx Hash**: [`0xe5280ff02e2a7f73d8953b34968a07ec7f14640b6bc390c8fcaa4be599478f50`](https://pudge.explorer.nervos.org/transaction/0xe5280ff02e2a7f73d8953b34968a07ec7f14640b6bc390c8fcaa4be599478f50)

### 5️⃣ [05 - Debugging & Cycle Analysis](./05_class5-debugging/readme.md)
- **Concepts**: Deterministic offline debugging via `ckb-debugger`, mock transaction dump export, exit code conventions, and cycle profiling.
- **Code**: [`debug_workflow_demo.js`](./05_class5-debugging/scripts/debug_workflow_demo.js)
- **Artifact**: [`mock_tx_dump.json`](./05_class5-debugging/mock_tx_dump.json)
- **Tx Hash**: [`0xf56963da6ce4d7c0a20c22cc1d2d3fc264c76cda4501cd12f4b957ca0bf0c26c`](https://pudge.explorer.nervos.org/transaction/0xf56963da6ce4d7c0a20c22cc1d2d3fc264c76cda4501cd12f4b957ca0bf0c26c)

---

## 📂 Directory Structure & Quick Navigation

```text
week4_report_builderTrack/
├── readme.md                                  <-- Master Report (You are here)
├── package.json                               <-- Toolchain dependencies (@ckb-ccc/core)
├── 01_class1-validation-model/                <-- Class 1: Validation Model
│   ├── readme.md
│   ├── scripts/validation_model_demo.js
│   └── images/
├── 02_class2-script-basics/                   <-- Class 2: Script Basics
│   ├── readme.md
│   ├── scripts/script_basics_demo.js
│   └── images/
├── 03_class3-udt/                             <-- Class 3: User Defined Tokens (sUDT)
│   ├── readme.md
│   ├── scripts/issue_udt_demo.js
│   └── images/
├── 04_class4-webassembly-on-ckb/              <-- Class 4: WebAssembly on CKB
│   ├── readme.md
│   ├── scripts/wasm_runtime_demo.js
│   └── images/
├── 05_class5-debugging/                       <-- Class 5: Debugging & Cycle Analysis
│   ├── readme.md
│   ├── mock_tx_dump.json
│   ├── scripts/debug_workflow_demo.js
│   └── images/
├── 06_class6-type-id/                         <-- (Upcoming: Part 2)
├── 07_class7-advanced-duktape-examples/       <-- (Upcoming: Part 2)
├── 08_class8-performant-wasm/                 <-- (Upcoming: Part 2)
├── 09_class9-cycle-reductions-in-duktape-script/ <-- (Upcoming: Part 2)
└── 10_class10-language-choices/               <-- (Upcoming: Part 2)
```
