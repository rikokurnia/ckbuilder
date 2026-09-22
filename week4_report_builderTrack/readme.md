# 🏆 Week 4 Builder Track Master Report (Classes 1 – 10 Complete)

**Name Builder**: Riko Kurnia Sandi  
**Track**: CKB Builder Track  
**Focus**: CKB Script Development Course (Full Curriculum: Validation Model, Script Basics, sUDT, WASM, Debugging, Type ID, Duktape, Performant WASM, Cycle Reductions, and Language Choices)

---

## 🌟 Executive Summary

This master report documents the comprehensive practical execution, architectural synthesis, and live on-chain testnet verification for **Week 4 (Intermediate Section)** of the *CKB Builder Handbook*. 

Week 4 completes the entire **CKB Script Development Course (Classes 1 – 10)**, establishing deep mastery over the CKB-VM RISC-V execution environment, smart contract primitives, multi-language paradigms, and computational optimization:
1. **The CKB-VM Validation Model (Class 1)**: Contrasting CKB's off-chain computation / on-chain verification paradigm against traditional EVM execution models, and enforcing the separation between Lock Scripts (authentication) and Type Scripts (state invariants).
2. **Script Anatomy & Resolution (Class 2)**: Analyzing `code_hash`, `hash_type` (`data` vs `type` / Type ID), dynamic `args` parameterization, `cell_deps` resolution, and RISC-V syscalls.
3. **User Defined Tokens (Class 3)**: Implementing the official Simple UDT standard (sUDT - RFC 0025) as first-class token citizens, serializing 128-bit unsigned integers in little-endian format, and validating issuance invariants.
4. **WebAssembly on CKB (Class 4)**: Exploring the execution of WebAssembly (.wasm) runtimes inside the RISC-V CKB-VM, language interoperability, and on-chain bytecode commitment.
5. **Debugging & Cycle Profiling (Class 5)**: Mastering the CKB debugging toolchain via offline mock transaction dumps (`ckb-debugger`), deterministic exit codes, and on-chain cycle consumption profiling.
6. **Type ID & Upgradability (Class 6)**: Implementing CKB RFC 0022 for immutable, globally unique script identity and seamless contract upgradability.
7. **Advanced Duktape on CKB-VM (Class 7)**: Deploying on-chain JavaScript contracts using `ckb-js-vm` (Duktape engine compiled to RISC-V) and CKB syscall bindings.
8. **Performant WASM (Class 8)**: Minimizing WASM binary footprints, heapless execution, and integer arithmetic optimization for low-cycle CKB-VM execution.
9. **Cycle Reductions in Duktape Script (Class 9)**: Applying bytecode pre-compilation, local syscall caching, flat loop dispatch, and early exit guards to minimize JavaScript cycle consumption.
10. **Language Choices for CKB (Class 10)**: Comprehensive trade-off analysis comparing Rust (`ckb-std`), C/C++, JavaScript (`ckb-js-vm`), and WebAssembly (WASM) on CKB-VM.

Every single class was verified with a live transaction broadcasted and committed on the **CKB Public Testnet (Pudge)**.

---

## 📊 On-Chain Verification Summary Matrix (Classes 1 – 10)

| Class / Module | Focus / Primitive | Transaction Hash | Block Number | Status |
| :--- | :--- | :--- | :---: | :---: |
| **01 - Validation Model** | Lock vs. Type Script separation, state cell storage | [`0xca5f64c537...679e50`](https://pudge.explorer.nervos.org/transaction/0xca5f64c537efd3ad00477a514bb10ae0e4e0c9aae22f7954a4b19dbe64679e50) | `#22,501,287` | 🟢 Committed |
| **02 - Script Basics** | Parameterized `args` (`0xc0c0`), cell deps | [`0x2e49f3e728...cb72a4`](https://pudge.explorer.nervos.org/transaction/0x2e49f3e728d804823e0b2d8dd69eebfb954b3fb395cc7dae3689c36a19cb72a4) | `#22,501,010` | 🟢 Committed |
| **03 - sUDT Tokens** | Minted 10,000,000 sUDT tokens (`u128` LE) | [`0x11814b0e26...96d6f0`](https://pudge.explorer.nervos.org/transaction/0x11814b0e26806983e5fe5bee4f7824ef2094fb08e57c1f880af15fd25796d6f0) | `#22,501,025` | 🟢 Committed |
| **04 - WASM on CKB** | Committed 41-byte WASM validation bytecode | [`0x16052891ee...0d588`](https://pudge.explorer.nervos.org/transaction/0x16052891ee5f95ffa2ae5e19ceea8eb15b510c6a5f3d679a53953eb58970d588) | `#22,501,373` | 🟢 Committed |
| **05 - Debugging** | Mock tx dump export, 1.64M cycle profiling | [`0xf56963da6c...0c26c`](https://pudge.explorer.nervos.org/transaction/0xf56963da6ce4d7c0a20c22cc1d2d3fc264c76cda4501cd12f4b957ca0bf0c26c) | `#22,501,048` | 🟢 Committed |
| **06 - Type ID** | RFC 0022 deterministic args calculation | [`0x923474ed7e...e36948`](https://pudge.explorer.nervos.org/transaction/0x923474ed7ec0ea1222ced36052bddcbb6846154fc926b53bad510f99cfe36948) | `#22,501,507` | 🟢 Committed |
| **07 - Advanced Duktape** | `ckb-js-vm` on-chain JavaScript smart contract | [`0xf45acdca68...049f827`](https://pudge.explorer.nervos.org/transaction/0xf45acdca6873eb9e9252580ac495d535587f77cd8ffe6f749dd6ee142049f827) | `#22,501,597` | 🟢 Committed |
| **08 - Performant WASM** | 43-byte stripped integer arithmetic WASM module | [`0xf2c3da03ad...d88353c`](https://pudge.explorer.nervos.org/transaction/0xf2c3da03add69fd218d604dc41c6bdd2e4c16b8b64b76ee32a5055352d88353c) | `#22,501,607` | 🟢 Committed |
| **09 - Cycle Reductions** | Optimized Duktape contract, 1.65M cycles | [`0xbf5a13ab46...592eb`](https://pudge.explorer.nervos.org/transaction/0xbf5a13ab466e705d22b8ce96cc06fbdcfa90f354d98ddf6c9f0cba31a9b592eb) | `#22,501,972` | 🟢 Committed |
| **10 - Language Choices** | Multi-language architecture commitment cell | [`0x6fbbcbe1ce...81912`](https://pudge.explorer.nervos.org/transaction/0x6fbbcbe1cecac223961651d472406e4f6d7408868bcd5a09de48b12bf2281912) | `#22,501,979` | 🟢 Committed |

---

## 📂 Sub-Module Documentation & Deliverables

### 1️⃣ [01 - Validation Model](./01_class1-validation-model/readme.md)
- **Concepts**: Off-chain computation, on-chain validation, Lock Script authentication, Type Script invariant enforcement.
- **Code**: [`validation_model_demo.js`](./01_class1-validation-model/scripts/validation_model_demo.js)
- **Tx Hash**: [`0xca5f64c537efd3ad00477a514bb10ae0e4e0c9aae22f7954a4b19dbe64679e50`](https://pudge.explorer.nervos.org/transaction/0xca5f64c537efd3ad00477a514bb10ae0e4e0c9aae22f7954a4b19dbe64679e50)

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
- **Tx Hash**: [`0x16052891ee5f95ffa2ae5e19ceea8eb15b510c6a5f3d679a53953eb58970d588`](https://pudge.explorer.nervos.org/transaction/0x16052891ee5f95ffa2ae5e19ceea8eb15b510c6a5f3d679a53953eb58970d588)

### 5️⃣ [05 - Debugging & Cycle Analysis](./05_class5-debugging/readme.md)
- **Concepts**: Deterministic offline debugging via `ckb-debugger`, mock transaction dump export, exit code conventions, and cycle profiling.
- **Code**: [`debug_workflow_demo.js`](./05_class5-debugging/scripts/debug_workflow_demo.js)
- **Artifact**: [`mock_tx_dump.json`](./05_class5-debugging/mock_tx_dump.json)
- **Tx Hash**: [`0xf56963da6ce4d7c0a20c22cc1d2d3fc264c76cda4501cd12f4b957ca0bf0c26c`](https://pudge.explorer.nervos.org/transaction/0xf56963da6ce4d7c0a20c22cc1d2d3fc264c76cda4501cd12f4b957ca0bf0c26c)

### 6️⃣ [06 - Type ID](./06_class6-type-id/readme.md)
- **Concepts**: CKB RFC 0022, single instance contract guarantee, deterministic args calculation `hash(first_input | output_index)`, and contract upgradability.
- **Code**: [`type_id_demo.js`](./06_class6-type-id/scripts/type_id_demo.js)
- **Tx Hash**: [`0x923474ed7ec0ea1222ced36052bddcbb6846154fc926b53bad510f99cfe36948`](https://pudge.explorer.nervos.org/transaction/0x923474ed7ec0ea1222ced36052bddcbb6846154fc926b53bad510f99cfe36948)

### 7️⃣ [07 - Advanced Duktape Examples](./07_class7-advanced-duktape-examples/readme.md)
- **Concepts**: Deploying and executing JavaScript on CKB-VM, `ckb-js-vm` system script, Duktape ECMAScript runtime, and `CKB` syscall bindings.
- **Code**: [`duktape_jsvm_demo.js`](./07_class7-advanced-duktape-examples/scripts/duktape_jsvm_demo.js)
- **Tx Hash**: [`0xf45acdca6873eb9e9252580ac495d535587f77cd8ffe6f749dd6ee142049f827`](https://pudge.explorer.nervos.org/transaction/0xf45acdca6873eb9e9252580ac495d535587f77cd8ffe6f749dd6ee142049f827)

### 8️⃣ [08 - Performant WASM](./08_class8-performant-wasm/readme.md)
- **Concepts**: Performance engineering, binary size stripping, zero dynamic allocations, integer arithmetic, and cycle minimization.
- **Code**: [`performant_wasm_demo.js`](./08_class8-performant-wasm/scripts/performant_wasm_demo.js)
- **Tx Hash**: [`0xf2c3da03add69fd218d604dc41c6bdd2e4c16b8b64b76ee32a5055352d88353c`](https://pudge.explorer.nervos.org/transaction/0xf2c3da03add69fd218d604dc41c6bdd2e4c16b8b64b76ee32a5055352d88353c)

### 9️⃣ [09 - Cycle Reductions in Duktape Script](./09_class9-cycle-reductions-in-duktape-script/readme.md)
- **Concepts**: Bytecode pre-compilation, syscall caching, prototype minimization, early exit guards, and cycle profiling (1.65M cycles).
- **Code**: [`cycle_reduction_demo.js`](./09_class9-cycle-reductions-in-duktape-script/scripts/cycle_reduction_demo.js)
- **Tx Hash**: [`0xbf5a13ab466e705d22b8ce96cc06fbdcfa90f354d98ddf6c9f0cba31a9b592eb`](https://pudge.explorer.nervos.org/transaction/0xbf5a13ab466e705d22b8ce96cc06fbdcfa90f354d98ddf6c9f0cba31a9b592eb)

### 🔟 [10 - Language Choices](./10_class10-language-choices/readme.md)
- **Concepts**: Comparative architecture and trade-off analysis across Rust (`ckb-std`), C/C++, JavaScript (`ckb-js-vm`), and WebAssembly (WASM).
- **Code**: [`language_comparison_demo.js`](./10_class10-language-choices/scripts/language_comparison_demo.js)
- **Tx Hash**: [`0x6fbbcbe1cecac223961651d472406e4f6d7408868bcd5a09de48b12bf2281912`](https://pudge.explorer.nervos.org/transaction/0x6fbbcbe1cecac223961651d472406e4f6d7408868bcd5a09de48b12bf2281912)

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
├── 06_class6-type-id/                         <-- Class 6: Type ID & Upgradability
│   ├── readme.md
│   ├── scripts/type_id_demo.js
│   └── images/
├── 07_class7-advanced-duktape-examples/       <-- Class 7: Advanced Duktape (ckb-js-vm)
│   ├── readme.md
│   ├── scripts/duktape_jsvm_demo.js
│   └── images/
├── 08_class8-performant-wasm/                 <-- Class 8: Performant WASM Optimization
│   ├── readme.md
│   ├── scripts/performant_wasm_demo.js
│   └── images/
├── 09_class9-cycle-reductions-in-duktape-script/ <-- Class 9: Cycle Reductions
│   ├── readme.md
│   ├── scripts/cycle_reduction_demo.js
│   └── images/
└── 10_class10-language-choices/               <-- Class 10: Language Choices
    ├── readme.md
    ├── scripts/language_comparison_demo.js
    └── images/
```
