# 📦 02 - ckb-ssri-std on crates.io: Registry Inventory

**Module**: Week 7 - SSRI Track (Part 2/7)  
**Author**: Riko Kurnia Sandi  
**Official Reference**: [ckb-ssri-std on crates.io](https://crates.io/crates/ckb-ssri-std)

---

## 1. Overview

`ckb-ssri-std` is the **SDK for implementing SSRI-compliant smart contracts on CKB** — the on-chain half of the Talk design (dispatch, traits, off-chain syscalls). Published by `Hanssen0` (same author as the ssri-test prototype).

## 2. Registry Facts (live API, fetched 2026-10-13)

| Field | Value |
| :--- | :--- |
| Versions | Exactly **1**: `0.0.1` (2025-01-10) |
| License / Edition | MIT / 2021 |
| Downloads | 1414 total, 83 recent |
| Repository | `github.com/ckb-devrel/ckb-ssri-std` |
| Dependencies | `ckb-ssri-std-proc-macro ^0.0.1`, `ckb-std ^0.16.4`, `serde ^1.0.210` (no-default), `serde_molecule ^1.1.0` |
| Tarball | 8707 bytes, sha256 `3ce0963e...6c63580` |

**Reading**: `no_std`-first dependency set (`serde`/`serde_molecule` without std, `ckb-std` with allocator) — this SDK targets **CKB-VM contracts**, not servers. Single 0.0.1 since Jan 2025 = stable minimal surface; the ecosystem builds traits on top (see module 05/06).

## 3. Practical Demonstration

Executable: [`scripts/crate_inventory_demo.js`](./scripts/crate_inventory_demo.js) — queries the crates.io API live (note: API requires a `User-Agent` header, otherwise HTTP 403):

```text
📦 Crate: ckb-ssri-std (id ckb-ssri-std)
   Latest      : 0.0.1 (only 1 version)
   Downloads: 1414 (recent 83)
🔗 Dependencies of v0.0.1:
   - ckb-ssri-std-proc-macro ^0.0.1
   - ckb-std ^0.16.4 | - serde ^1.0.210 | - serde_molecule ^1.1.0
📥 Tarball: .../ckb-ssri-std-0.0.1.crate
   HTTP 200, 8707 bytes (expect 8707)
   sha256: 3ce0963ee3c182e0cf45bc91562fe3977fa84443442dc24a4d408d05f6c63580
🏁 Week7-02 Crate Inventory Complete!
```

> 📸 **Execution Proof**: save terminal capture as `images/foto-2.png`.

The tarball verified here is vendored byte-identical for module 05 (`05_sdk-docs/vendor/ckb-ssri-std-0.0.1/`).

## 🚀 Reproduction Guide

```bash
cd week7_report_builderTrack
node "01_SSRI/02_sdk-crates/scripts/crate_inventory_demo.js"
```
