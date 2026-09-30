# 🛡️ 05 - Using Molecule in CKB Scripts & On-Chain Verification

**Module**: Week 5 - Serialization Track (Lesson 17)  
**Author**: Riko Kurnia Sandi  
**Official Reference**: [Nervos Docs: Use in CKB Scripts](https://docs.nervos.org/docs/serialization/use-in-ckb-scripts) | [CKB-VM Syscalls](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0009-vm-syscalls/0009-vm-syscalls.md)

---

## 1. On-Chain Ingestion Pipeline

Inside the **CKB-VM**, a smart contract interacts with the transaction environment exclusively via system calls (`ecall` instructions). State data stored in cells or witness fields arrives as raw byte buffers:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CKB-VM Memory Space                             │
│                                                                        │
│  1. Syscall Load       ckb_load_cell_data(&buf, len, 0, Source::Output)│
│  2. Byte Buffer        [ 0x5c, 0x00, 0x00, 0x00, 0x14, ... ]          │
│                                  │                                     │
│  3. Zero-Copy Reader             ▼                                     │
│                        mol_reader_t / Reader<&[u8]>                    │
│                        ├── Total size header check (4 bytes)           │
│                        ├── Field offset resolution (O_i lookup)        │
│                        └── Field validation with 0 heap allocation     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Low-Level Contract Architecture (`molecule_validator_sample.rs`)

We authored a production-grade `#![no_std]` Rust contract in [`contracts/molecule_validator_sample.rs`](./contracts/molecule_validator_sample.rs).

### Key Architectural Patterns:
1. **Zero-Copy Ingestion**:
   ```rust
   let raw_data = load_cell_data(0, Source::Output)?;
   ```
2. **Deterministic Table Header Inspection**:
   ```rust
   let total_size = u32::from_le_bytes(raw_data[0..4].try_into().unwrap()) as usize;
   if total_size != raw_data.len() {
       return Err(ContractError::EncodingInvalid);
   }
   ```
3. **Offset Dereferencing**:
   Field 0 offset is located at bytes `4..8`. The contract immediately jumps to the target offset to inspect `version`:
   ```rust
   let offset_0 = u32::from_le_bytes(raw_data[4..8].try_into().unwrap()) as usize;
   let version = u32::from_le_bytes(raw_data[offset_0..offset_0 + 4].try_into().unwrap());
   ```
4. **Invariant Enforcement**:
   If the state version is invalid or invariants fail, the contract terminates immediately with a non-zero exit code (`Err(ContractError::InvariantViolation)` -> Exit Code `5`), rejecting the transaction before any state transition occurs.

---

## 3. Simulation & Validation Results

We executed the complete CKB-VM inspection simulation suite in [`scripts/script_molecule_inspection.js`](./scripts/script_molecule_inspection.js), testing three critical boundary scenarios:

```text
CKB-VM Script Molecule Verification Simulation
----------------------------------------------
[Test 1] Valid State Cell Data:
Hex: 0x5c00000014000000180000003800000040000000010000009999999999999999... [92 bytes]

-> Ingesting Cell Data (92 bytes)...
   Direct pointer read: version=1, reputation=500
   [Syscall Exit 0]: SUCCESS (All state invariants satisfied)

[Test 2] State Violating Invariant (Reputation = 50 < 100):

-> Ingesting Cell Data (86 bytes)...
   Direct pointer read: version=1, reputation=50
   [Syscall Exit 5]: InvariantViolation (Reputation below threshold: 50 < 100)

[Test 3] Tampered Binary Payload (Corrupted Header):

-> Ingesting Cell Data (92 bytes)...
   [Syscall Exit 4]: EncodingInvalid (Header totalSize=255 != DataLen=92)

Summary of Verification Runs:
  Test 1 Exit Code: 0 (Expected 0)
  Test 2 Exit Code: 5 (Expected 5)
  Test 3 Exit Code: 4 (Expected 4)
```

---

## 4. Key Takeaways

- Ingesting Molecule data in CKB scripts requires **zero deserialization memory overhead**, ensuring extreme cycle efficiency.
- By reading table offsets directly, contracts can inspect specific fields in large cell data payloads without decoding the entire object.
- Next, we assemble all concepts into a complete end-to-end decentralized application in [06_example-role-playing-game](../06_example-role-playing-game/readme.md).
