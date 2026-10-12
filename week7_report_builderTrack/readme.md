# 🏆 Week 7 Builder Track Master Report: SSRI Deep Dive & Live Execution

**Name Builder**: Riko Kurnia Sandi  
**Date**: 13 October 2026  
**Track**: CKB Builder Track (Phase 3: Advanced - SSRI)

---

## 🌟 Executive Summary

This master report synthesizes the research, engineering, and live verification completed during **Week 7 (Part 1)** of the Nervos CKB Builder Track. It completes the Handbook **SSRI (Script-Sourced Rich Information)** block across all 7 assigned materials: forum design, SDK registry + docs, first prototype, off-chain executor, production contract, and security audit.

Core result: SSRI's loop — **on-chain code, off-chain execution** — was reproduced end to end on Pudge testnet:

1. **Design (Talk #8256)**: method paths recomputed from definition; known vector `SSRI.get_methods = 0x58f02409de9de7b1` ✅.
2. **SDK (crates.io + docs.rs)**: `ckb-ssri-std 0.0.1` inventoried live; byte-identical source vendored and API-mapped (9 files).
3. **Prototype (ssri-test)**: dispatch walked; deployment code cell `0x900afcf7...:0` proven **committed** (block `#13,970,123`).
4. **Executor (ssri-server)**: built from source, found + fixed a real incompatibility (`set_content` 2103 arm commented out; patch vendored), then 4/4 live method calls.
5. **Production (pausable-udt)**: 6 live PUDT cells; `symbol="PUDT"`, `decimals=0x06` (differs from CLI default 8 — flagged), `enumerate_paused` returning the external pause-data cell `0x27568466...:0` (**committed**).
6. **Audit (ScaleBit)**: 0 exploitable issues; 1 informational (centralization by design, acknowledged).

> Scope: `01_SSRI` only. `02_RGB++/` is intentionally empty — next report.

---

## 📊 Curriculum & Verification Synthesis

| Sub-Module | Domain / Topic | Core Technical Primitive | Verification Deliverable |
| :--- | :--- | :--- | :--- |
| [**01_SSRI/01_intro-talk**](./01_SSRI/01_intro-talk/readme.md) | Design + method paths | `argv[0]` dispatch, Code→Tx levels | [`ssri_method_path_demo.js`](./01_SSRI/01_intro-talk/scripts/ssri_method_path_demo.js) (vector ✅) |
| [**01_SSRI/02_sdk-crates**](./01_SSRI/02_sdk-crates/readme.md) | Registry inventory | crates.io API, no_std deps | [`crate_inventory_demo.js`](./01_SSRI/02_sdk-crates/scripts/crate_inventory_demo.js) |
| [**01_SSRI/03_ssri-test-prototype**](./01_SSRI/03_ssri-test-prototype/readme.md) | Prototype + deploy tx | `ssri_methods!`, fallback, code cell | Tx [`0x900afcf7...`](https://pudge.explorer.nervos.org/transaction/0x900afcf79235e88f7bdf8a5d320365b7912f8074f4489a68405f43586fc51e5c) Block `#13,970,123` |
| [**01_SSRI/04_ssri-server**](./01_SSRI/04_ssri-server/readme.md) | Off-chain execution | CKB-VM + `set_content`, 2103 patch | [`ssri_server_demo.js`](./01_SSRI/04_ssri-server/scripts/ssri_server_demo.js) (4/4 live) |
| [**01_SSRI/05_sdk-docs**](./01_SSRI/05_sdk-docs/readme.md) | API map | UDT/UDTPausable, syscalls 2277/87/97 | [`sdk_api_map_demo.js`](./01_SSRI/05_sdk-docs/scripts/sdk_api_map_demo.js) |
| [**01_SSRI/06_pausable-udt**](./01_SSRI/06_pausable-udt/readme.md) | Production live proof | PUDT cells, pause-data chain | [`pausable_udt_live_demo.js`](./01_SSRI/06_pausable-udt/scripts/pausable_udt_live_demo.js) |
| [**01_SSRI/07_audit-report**](./01_SSRI/07_audit-report/readme.md) | Audit digest | MAI-1 acknowledged | [`audit_digest_demo.js`](./01_SSRI/07_audit-report/scripts/audit_digest_demo.js) |

---

## 1️⃣–7️⃣ Sub-Reports

> 📂 Each lives under [`01_SSRI/`](./01_SSRI/readme.md): `01_intro-talk` · `02_sdk-crates` · `03_ssri-test-prototype` · `04_ssri-server` · `05_sdk-docs` · `06_pausable-udt` · `07_audit-report` — each with `readme.md + scripts/ + images/foto-N.png`.
>
> Execution proofs: `images/foto-N.png` per sub (terminal captures, user attaches). Cross-links: module-01 path table ↔ module-04 live `get_methods` (8/8 match); module-02 checksum ↔ module-05 vendor; module-06 pause cell ↔ module-07 MAI-1 surface.

---

## 🛡️ Evidence Boundaries (honest scope)

| Capability | Current evidence |
|---|---|
| Method-path theory | Recomputed locally, known vector ✅ + on-chain method list match |
| Prototype deployment | Real Pudge tx `0x900afcf7...` (committed, 33328-byte code cell) |
| Off-chain execution | 4 live calls vs prototype + 4 vs production PUDT (local VM + testnet RPC) |
| Server patch | Vendored 6-line diff; stock server demonstrably fails without it |
| PUDT state | 6 live cells + committed pause-data cell |
| PUDT mint/transfer tx | **None — deferred**: owner lock is not the builder key |
| RGB++ | Out of scope (`02_RGB++/` empty, next report) |

---

## 📂 Project Structure & Navigation

```text
week7_report_builderTrack/
├── package.json
├── readme.md (Master Report - You are here)
└── 01_SSRI/
    ├── readme.md (Module report)
    ├── 01_intro-talk/        readme + scripts/ssri_method_path_demo.js + images/foto-1.png*
    ├── 02_sdk-crates/        readme + scripts/crate_inventory_demo.js  + images/foto-2.png*
    ├── 03_ssri-test-prototype/ readme + scripts/prototype_walkthrough_demo.js + images/foto-3.png* + vendor/ssri-test/
    ├── 04_ssri-server/       readme + scripts/ssri_server_demo.js + images/foto-4.png* + server-2103-compat.patch
    ├── 05_sdk-docs/          readme + scripts/sdk_api_map_demo.js + images/foto-5.png* + vendor/ckb-ssri-std-0.0.1/
    ├── 06_pausable-udt/      readme + scripts/pausable_udt_live_demo.js + images/foto-6.png*
    └── 07_audit-report/      readme + scripts/audit_digest_demo.js + images/foto-7.png* + audit PDF
    (* foto-N.png: user attaches terminal captures)
```

## 🚀 Verification Commands

```bash
cd week7_report_builderTrack
npm install
node "01_SSRI/01_intro-talk/scripts/ssri_method_path_demo.js"
node "01_SSRI/02_sdk-crates/scripts/crate_inventory_demo.js"
node "01_SSRI/03_ssri-test-prototype/scripts/prototype_walkthrough_demo.js"
node "01_SSRI/04_ssri-server/scripts/ssri_server_demo.js"
node "01_SSRI/05_sdk-docs/scripts/sdk_api_map_demo.js"
node "01_SSRI/06_pausable-udt/scripts/pausable_udt_live_demo.js"
node "01_SSRI/07_audit-report/scripts/audit_digest_demo.js"
```
