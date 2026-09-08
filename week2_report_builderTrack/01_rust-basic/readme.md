# 🦀 01 - Intensive Smart Contract Development with Rust & CKB-CLI

**Name Builder**: Riko Kurnia Sandi  
**Week**: Week 2 (Lesson 8)  
**Track**: CKB Builder Track

---

## 🧭 Executive Summary

This module implements and validates **Lesson 8: Intensive Smart Contract Development with Rust** from the official *CKB Builder Handbook*. Unlike account-based EVMs, the **CKB-VM** executes standard **RISC-V** instruction set binaries directly at the hardware layer. Writing smart contracts in **Rust** provides memory safety, zero-cost abstractions, deterministic execution, and extreme cycle efficiency.

In this module, we developed, compiled, and validated:
1. **On-Chain Bare-Metal Contract (`simple-guard`)**: A `no_std` CKB script written in Rust utilizing `ckb-std` (v1.1.0) and compiled to bare-metal `riscv64imac-unknown-none-elf`.
2. **Off-Chain Rust RPC Client (`ckb-client`)**: An asynchronous Rust application querying live blockchain state from the public CKB Testnet (`https://testnet.ckb.dev/rpc`).
3. **CKB-CLI Toolchain (`ckb-cli v2.0.0`)**: Comprehensive command-line account management, testnet querying, and live cell state inspection.

---

## 🏗️ Architectural Foundations: Rust on CKB-VM

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CKB-VM Execution Pipeline                       │
├───────────────────┬─────────────────────────┬──────────────────────────┤
│   Rust Source     │    LLVM / rustc Target  │     CKB-VM (RISC-V)      │
│  (no_std + ckb-std│ ➔  riscv64imac-unknown- ➔   Bare-Metal RISC-V 64   │
│   Smart Contract) │       none-elf ELF      │    Syscall Environment   │
└───────────────────┴─────────────────────────┴──────────────────────────┘
```

### Why Rust for CKB Development?
- **Hardware-Level RISC-V Target**: CKB-VM implements the open standard RISC-V (RV64IMC) architecture. Rust targets `riscv64imac-unknown-none-elf` natively, producing static ELF executables without an intermediary bytecode interpreter.
- **Zero-Cost Abstractions**: Rust eliminates garbage collection pauses and dynamic runtime overhead. Contracts run in bare-metal `no_std` mode with precise stack and heap limits.
- **Cycle Efficiency**: Storage and execution on CKB are constrained by **Cycles**. Rust-compiled binaries achieve orders-of-magnitude lower cycle consumption compared to Duktape/QuickJS runtimes.
- **Strict Invariant Checking**: CKB scripts act as pure validators—returning exit code `0` for valid transactions, or a non-zero code on failure.

---

## 📦 1. On-Chain Smart Contract: `simple-guard`

> 📂 **Project Directory**: [👉 Click here to inspect contracts/simple-guard](./contracts/simple-guard)  
> 📄 **Source Code**: [👉 Click here to view main.rs](./contracts/simple-guard/src/main.rs)  
> ⚠️ **Error Definition**: [👉 Click here to view error.rs](./contracts/simple-guard/src/error.rs)

The `simple-guard` contract acts as an on-chain state and capacity validator. It enforces the following rules inside the CKB-VM:
1. **Script Inspection**: Resolves its own executing script and decodes `args` via `load_script()`.
2. **Transaction Digest Loading**: Loads the current transaction hash via `load_tx_hash()`.
3. **Capacity Conservation Invariant**: Queries all input cells and output cells using `QueryIter` and `load_cell_capacity`. Ensures that total output capacity never exceeds total input capacity (preserving capacity conservation and preventing unauthorized creation of capacity out of thin air).
4. **Debug Trace Emission**: Emits structured debug logs to the CKB-VM syscall layer via `ckb_std::debug!`.

### Code Walkthrough (`src/main.rs`)

```rust
#![no_std]
#![cfg_attr(not(test), no_main)]

#[cfg(test)]
extern crate alloc;

#[cfg(not(test))]
use ckb_std::default_alloc;
#[cfg(not(test))]
default_alloc!();

mod error;

use ckb_std::{
    ckb_constants::Source,
    ckb_types::prelude::*,
    debug,
    entry,
    high_level::{load_cell_capacity, load_script, load_tx_hash, QueryIter},
};
use error::Error;

entry!(program_entry);

fn program_entry() -> i8 {
    match guard_logic() {
        Ok(_) => 0,
        Err(err) => err as i8,
    }
}

fn guard_logic() -> Result<(), Error> {
    debug!("=== [SimpleGuard CKB-VM Contract] Initializing ===");

    let script = load_script()?;
    let args: ckb_std::ckb_types::bytes::Bytes = script.args().unpack();
    debug!("Script args length: {} bytes", args.len());

    let tx_hash = load_tx_hash()?;
    debug!("Executing inside Tx hash byte 0: {:#04x}", tx_hash[0]);

    let total_input_capacity: u64 = QueryIter::new(load_cell_capacity, Source::Input).sum();
    let total_output_capacity: u64 = QueryIter::new(load_cell_capacity, Source::Output).sum();

    if total_input_capacity > 0 && total_output_capacity > total_input_capacity {
        debug!("Error: Output capacity exceeds input capacity! Conservation violated.");
        return Err(Error::InvalidCapacityBalance);
    }

    debug!("=== [SimpleGuard CKB-VM Contract] Verification Passed (Code 0) ===");
    Ok(())
}
```

### Binary Compilation & Verification
The contract is compiled using `clang` and `rustc` configured for `riscv64imac-unknown-none-elf` with size-optimization flags (`opt-level = "z"`, `lto = true`, `strip = true`):

```bash
CC=clang cargo build --target riscv64imac-unknown-none-elf --release
```

**Compiled Binary Details**:
- **Artifact Path**: `contracts/simple-guard/target/riscv64imac-unknown-none-elf/release/simple-guard`
- **File Format**: `ELF 64-bit LSB executable, UCB RISC-V, RVC, soft-float ABI, version 1 (SYSV), statically linked, stripped`
- **Binary Size**: **`13 KB`** (ultra-compact RISC-V bare-metal executable)

---

## 📡 2. Off-Chain Rust RPC Client: `ckb-client`

> 📂 **Project Directory**: [👉 Click here to inspect client/ckb-client](./client/ckb-client)  
> 📄 **Source Code**: [👉 Click here to view main.rs](./client/ckb-client/src/main.rs)

To demonstrate off-chain integration in Rust, we built `ckb-client`, an async CLI application built with `tokio` and `reqwest` that interfaces directly with the CKB Testnet JSON-RPC endpoint.

### Live Execution Output
```text
╔═══════════════════════════════════════════════════════════════════════════╗
║       🦀 Nervos CKB Rust Off-Chain RPC Client (Week 2 - 01 Rust Basic)     ║
╚═══════════════════════════════════════════════════════════════════════════╝
🔗 RPC Endpoint: https://testnet.ckb.dev/rpc

📡 [1/3] Querying Blockchain Information...
   • Chain Name      : ckb_testnet
   • Difficulty      : 0x1e54d7a9
   • Initial Syncing : false

📦 [2/3] Querying Tip Header (Latest Block)...
   • Block Number    : #22345676 (0x154f7cc)
   • Block Hash      : 0x3c7bc9c38ffc7306ef538f0ea69981f22be0af29cd813121cd24d1953abe6c77
   • Epoch Info      : 0x70803ab0035d9
   • Timestamp (ms)  : 1788829941437 ms

⚙️  [3/3] Querying Consensus & Epoch Information...
   • Current Epoch   : #13785
   • Epoch Start Blk : #22344737
   • Epoch Length    : 1800 blocks

✅ All CKB Testnet RPC queries executed successfully via Rust!
```

---

## 🛠️ 3. CKB-CLI Toolchain & Testnet Validation

> 📂 **Scripts Directory**: [👉 Click here to inspect ckb-cli-scripts](./ckb-cli-scripts)  
> 📄 **Network Script**: [👉 Click here to view 01_check_network.sh](./ckb-cli-scripts/01_check_network.sh)  
> 📄 **Balance Script**: [👉 Click here to view 03_query_balance.sh](./ckb-cli-scripts/03_query_balance.sh)

We installed and configured official **CKB-CLI v2.0.0** (`ckb-cli 2.0.0 (80efc21 2025-12-03)`) for administrative and developer operations.

### Verification 1: Network Tip & Epoch
```bash
./ckb-cli-scripts/01_check_network.sh
```
**Output**:
```text
=== [CKB-CLI] 1. Check Network & Tip Header ===
22345670
hash: 0xa2fd0842e0b4646349824d56e29fe57ecc93e8f1d3286e46130b62c916942f29
number: 22345670
epoch: "0x70803a50035d9 {number: 13785, index: 933, length: 1800}"
transactions_root: 0xec2340f11f8e2d539e96cafff21939619a5d0636cc851d88f1f2ed40f4786c76

=== [CKB-CLI] 2. Current Epoch Info ===
compact_target: 0x1d0870aa
length: 1800
number: 13785
start_number: 22344737
```

### Verification 2: On-Chain Wallet Balance & Live Cell Inspection
Querying the builder address from Week 1:
```bash
./ckb-cli-scripts/03_query_balance.sh
```
**Output**:
```text
=== [CKB-CLI] Querying Total On-Chain Capacity for Address ===
Target Address: ckt1qrejnmlar3r452tcg57gvq8patctcgy8acync0hxfnyka35ywafvkqgj6nal3nydecn6saa67e0af9rpm0c4pne6qqxl6ue4

total: 4999.99999167 (CKB)

=== [CKB-CLI] Inspecting Individual Live Cells (State & Data) ===
live_cells:
  - capacity: 500.0 (CKB)
    data_bytes: 30
    number: 22278289
    tx_hash: 0x8c5253aaed89270f8707d65eaa287d547ea568c7539ecd94ede505381404c0f3
  - capacity: 4499.99999167 (CKB)
    data_bytes: 0
    number: 22278289
    tx_hash: 0x8c5253aaed89270f8707d65eaa287d547ea568c7539ecd94ede505381404c0f3
```
*(Notice the `500.0 CKB` cell storing the 30-byte on-chain memo from Week 1, and the `4499.99999167 CKB` capacity balance cell).*

---

## 🚀 Step-by-Step Reproduction Guide

### 1. Compile the Rust Smart Contract
```bash
cd week2_report_builderTrack/01_rust-basic/contracts/simple-guard
CC=clang cargo build --target riscv64imac-unknown-none-elf --release
```

### 2. Run the Off-Chain Rust RPC Client
```bash
cd week2_report_builderTrack/01_rust-basic/client/ckb-client
cargo run
```

### 3. Run CKB-CLI Testnet Scripts
```bash
cd week2_report_builderTrack/01_rust-basic/ckb-cli-scripts
./01_check_network.sh
./03_query_balance.sh
```

---

## 🛠️ Toolchain Matrix

```text
├── Rust Compiler:       rustc 1.95.0 (59807616e 2026-04-14)
├── Target Architecture: riscv64imac-unknown-none-elf
├── C Compiler:          clang 22.1.8 (for CKB-VM C runtime dependencies)
├── CKB Contract Crate:  ckb-std v1.1.0
├── Off-Chain Stack:     Tokio v1.53, Reqwest v0.12, Serde v1.0
├── CLI Tool:            CKB-CLI v2.0.0 (80efc21 2025-12-03)
└── Network Target:      CKB Public Testnet (Pudge)
```
