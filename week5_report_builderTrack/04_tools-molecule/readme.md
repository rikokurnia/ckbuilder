# 🛠️ 04 - Molecule Tooling, Compiler Architecture & Code Generation

**Module**: Week 5 - Serialization Track (Lesson 17)  
**Author**: Riko Kurnia Sandi  
**Official Reference**: [Nervos Docs: Molecule Tools](https://docs.nervos.org/docs/serialization/tools-molecule) | [GitHub: nervosnetwork/molecule](https://github.com/nervosnetwork/molecule)

---

## 1. The `moleculec` Compiler Architecture

The Molecule ecosystem centers around `moleculec`, an open-source schema compiler implemented in **Rust**. It parses `.mol` schema files into an Abstract Syntax Tree (AST) and coordinates code generation across different programming languages via a modular **plugin architecture**.

```text
       ┌───────────────────┐
       │   schema.mol      │
       └─────────┬─────────┘
                 │
                 ▼
       ┌───────────────────┐
       │     moleculec     │ ◄─── Core Rust Compiler (Lexer, Parser, AST Validator)
       └─────────┬─────────┘
                 │ (Pipes Serialized JSON AST via Stdin)
     ┌───────────┼───────────┬───────────┐
     ▼           ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Plugin: │ │ Plugin: │ │ Plugin: │ │ Plugin: │
│ C (raw) │ │  Rust   │ │   Go    │ │ JS / ES │
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
     ▼           ▼           ▼           ▼
 *.h files   *.rs files   *.go files  *.ts files
```

### Installation & CLI Usage:
```bash
cargo install moleculec --locked
# Check version
moleculec --version
```

---

## 2. Supported Target Languages & Plugins

### 1. C Code Generation (`moleculec-c` / Built-in C Plugin)
For smart contracts written in C running on CKB-VM:
- Generates single-header zero-copy reader macros (`mol_reader.h`) and data bindings (`blockchain.h`).
- Memory footprint is minimal with zero heap allocations:
```bash
moleculec --language - --schema-file schemas/demo.mol > demo.h
```

### 2. Rust Code Generation (`molecule` crate & `molecule-codegen`)
For bare-metal `#![no_std]` Rust contracts and off-chain tools:
- Produces immutable `Entity` structs, zero-copy `Reader` references (`&[u8]`), and mutable `Builder` types.
- Integrated automatically via `build.rs` in Cargo:
```rust
// build.rs
fn main() {
    molecule_codegen::Compiler::new()
        .input("schemas/demo.mol")
        .output("src/generated/demo.rs")
        .run()
        .expect("Failed to compile molecule schema");
}
```

### 3. TypeScript & Modern Web (`@ckb-ccc/core` & `moleculec-es`)
In dApp frontends and Node.js backend services:
- Traditional workflow used `moleculec-es` to emit TypeScript source files.
- Modern CKB dApp development uses `@ckb-ccc/core`'s native `mol` module, which offers schema-compliant dynamic codecs (`mol.table`, `mol.struct`, `mol.fixedItemVec`, `mol.dynItemVec`, `mol.union`, `mol.option`) without requiring an external binary compiler.

---

## 3. Demonstration & Pipeline Verification

We implemented a full schema parser and codec generation pipeline in [`scripts/tooling_pipeline_demo.js`](./scripts/tooling_pipeline_demo.js) demonstrating:
1. Parsing the declarative grammar in [`schemas/demo.mol`](./schemas/demo.mol).
2. Constructing the intermediate AST representation.
3. Dynamically binding the AST to executable codecs.
4. Serializing and verifying a structured `WitnessPayload` object.

### Execution Output:

```text
Molecule Compiler (moleculec) Architecture & Code Generation
------------------------------------------------------------
[1] Parsing schema file: demo.mol
[2] Generated AST Declarations (6 types detected):
    • array : Hash256
    • array : Uint32
    • array : Uint64
    • vector: Bytes
    • struct: Header (2 fields)
    • table : WitnessPayload (3 fields)

[3] Simulating Compiler Plugin Output (C / Rust / TypeScript):
    • Plugin moleculec-c  -> Emits mol_reader.h & demo.h with zero-copy accessors
    • Plugin molecule-rs   -> Emits packed::WitnessPayload, Reader, and Builder types
    • Plugin moleculec-es -> Emits JavaScript/TypeScript classes

[4] Executing Generated Codec Pipeline:
    Encoded WitnessPayload size : 102 bytes
    Encoded Hex                 : 0x66000000100000001c0000004100000001000000004efa660000000021000000... [truncated]
    Decoded Header Version      : 1
    Decoded Header Timestamp    : 1727680000
    Decoded Pubkey Length       : 68 bytes
    Validation Status           : SUCCESS (All fields intact)
```

---

## 4. Key Takeaways

- The modular plugin architecture ensures that whenever a new language target is needed, only an AST consumer plugin needs to be written.
- For off-chain tooling, TypeScript developers can choose between static generation (`moleculec-es`) or dynamic pure-JS codecs (`@ckb-ccc/core`).
- Next, we examine how Molecule is executed directly inside on-chain CKB-VM smart contracts in [05_use-in-ckb-scripts](../05_use-in-ckb-scripts/readme.md).
