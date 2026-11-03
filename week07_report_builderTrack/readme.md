# 🏆 Week 7 Builder Track Master Report: SSRI + RGB++

**Name Builder**: Riko Kurnia Sandi  
**Date**: 13 October 2026  
**Track**: CKB Builder Track (Phase 3: Advanced - SSRI + RGB++)

---

## 🌟 Executive Summary

This master report synthesizes the research, engineering, and live verification completed during **Week 7** of the Nervos CKB Builder Track. It completes **two** Handbook Advanced blocks in parallel:

### 🧩 Part 1 — SSRI (Script-Sourced Rich Information)

SSRI's loop — **on-chain code, off-chain execution** — reproduced end to end on Pudge testnet ([module report](./01_SSRI/readme.md)):

1. **Design (Talk #8256)**: method paths recomputed from definition; known vector `SSRI.get_methods = 0x58f02409de9de7b1` ✅.
2. **SDK (crates.io + docs.rs)**: `ckb-ssri-std 0.0.1` inventoried live; byte-identical source vendored and API-mapped (9 files).
3. **Prototype (ssri-test)**: dispatch walked; deployment code cell `0x900afcf7...:0` proven **committed** (block `#13,970,123`).
4. **Executor (ssri-server)**: built from source, found + fixed a real incompatibility (`set_content` 2103 arm commented out; patch vendored), then 4/4 live method calls.
5. **Production (pausable-udt)**: 6 live PUDT cells; `symbol="PUDT"`, `decimals=0x06` (differs from CLI default 8 — flagged), `enumerate_paused` returning the external pause-data cell `0x27568466...:0` (**committed**).
6. **Audit (ScaleBit)**: 0 exploitable issues; 1 informational (centralization by design, acknowledged).

### 🟧 Part 2 — RGB++ (Bitcoin's Turing Catalyst)

Bitcoin UTXOs as single-use seals bound 1:1 to Turing-complete CKB cells (isomorphic binding), with CKB as public asset database and pre-settlement layer ([module report](./02_RGB++/readme.md)):

1. **Introduction**: 4-step flow + commitment scheme proved offline (compute → re-verify → tamper-reject).
2. **Light paper**: seals, client-side validation, 4 RGB issues + answers, folding, Intent cells, non-interactive send/claim.
3. **Resources & deployments**: script standard, SPV stack, explorer, API gating finding, Meepo deployment validation.
4. **CCC RGB++ SDK**: primary vs legacy branch surface, UDT op shapes.
5. **On-chain practice**: both Meepo-testnet deployments hash-verified on Pudge + a real 21M-unit xUDT issuance (the CKB asset-state half of an RGB++ coin). The BTC seal leg (funded BTC-testnet key + API token) is user-side and honestly deferred.

---

## 📊 Curriculum & Verification Synthesis

### SSRI

| Sub-Module | Domain / Topic | Core Technical Primitive | Verification Deliverable |
| :--- | :--- | :--- | :--- |
| [**01_SSRI/01_intro-talk**](./01_SSRI/01_intro-talk/readme.md) | Design + method paths | `argv[0]` dispatch, Code→Tx levels | [`ssri_method_path_demo.js`](./01_SSRI/01_intro-talk/scripts/ssri_method_path_demo.js) (vector ✅) |
| [**01_SSRI/02_sdk-crates**](./01_SSRI/02_sdk-crates/readme.md) | Registry inventory | crates.io API, no_std deps | [`crate_inventory_demo.js`](./01_SSRI/02_sdk-crates/scripts/crate_inventory_demo.js) |
| [**01_SSRI/03_ssri-test-prototype**](./01_SSRI/03_ssri-test-prototype/readme.md) | Prototype + deploy tx | `ssri_methods!`, fallback, code cell | Tx [`0x900afcf7...`](https://pudge.explorer.nervos.org/transaction/0x900afcf79235e88f7bdf8a5d320365b7912f8074f4489a68405f43586fc51e5c) Block `#13,970,123` |
| [**01_SSRI/04_ssri-server**](./01_SSRI/04_ssri-server/readme.md) | Off-chain execution | CKB-VM + `set_content`, 2103 patch | [`ssri_server_demo.js`](./01_SSRI/04_ssri-server/scripts/ssri_server_demo.js) (4/4 live) |
| [**01_SSRI/05_sdk-docs**](./01_SSRI/05_sdk-docs/readme.md) | API map | UDT/UDTPausable, syscalls 2277/87/97 | [`sdk_api_map_demo.js`](./01_SSRI/05_sdk-docs/scripts/sdk_api_map_demo.js) |
| [**01_SSRI/06_pausable-udt**](./01_SSRI/06_pausable-udt/readme.md) | Production live proof | PUDT cells, pause-data chain | [`pausable_udt_live_demo.js`](./01_SSRI/06_pausable-udt/scripts/pausable_udt_live_demo.js) |
| [**01_SSRI/07_audit-report**](./01_SSRI/07_audit-report/readme.md) | Audit digest | MAI-1 acknowledged | [`audit_digest_demo.js`](./01_SSRI/07_audit-report/scripts/audit_digest_demo.js) |

### RGB++

| Sub-Module | Domain / Topic | Core Technical Primitive | Verification Deliverable |
| :--- | :--- | :--- | :--- |
| [**02_RGB++/01_rgbpp-introduction**](./02_RGB++/01_rgbpp-introduction/readme.md) | Intro + commitment scheme | Seal binding, `sha256(CKB_TX_B | seals)` | [`rgbpp_intro_demo.js`](./02_RGB++/01_rgbpp-introduction/scripts/rgbpp_intro_demo.js) (tamper-reject) |
| [**02_RGB++/02_light-paper**](./02_RGB++/02_light-paper/readme.md) | Seals → binding → apps + debate | Folding, Intent cells, send/claim | [`lightpaper_demo.js`](./02_RGB++/02_light-paper/scripts/lightpaper_demo.js) |
| [**02_RGB++/03_resources-deployments**](./02_RGB++/03_resources-deployments/readme.md) | Scripts, SPV, endpoints | Deployment validation, API gating | [`deployments_demo.js`](./02_RGB++/03_resources-deployments/scripts/deployments_demo.js) (4/4 PASS) |
| [**02_RGB++/04_ccc-rgbpp-sdk**](./02_RGB++/04_ccc-rgbpp-sdk/readme.md) | SDK branch surface | Primary vs legacy, UDT ops | [`ccc_rgbpp_demo.js`](./02_RGB++/04_ccc-rgbpp-sdk/scripts/ccc_rgbpp_demo.js) |
| [**02_RGB++/05_onchain-practice**](./02_RGB++/05_onchain-practice/readme.md) | Deployments + CKB-side coin | RGB++ lock, BTC_TIME lock, xUDT | Txs [`0xf1de59e9…`](https://pudge.explorer.nervos.org/transaction/0xf1de59e973b85791ec32debbba08dff80c63197e895eb95d67fc1e9f6b413e00) / [`0xde0f8787…`](https://pudge.explorer.nervos.org/transaction/0xde0f87878a97500f549418e5d46d2f7704c565a262aa17036c9c1c13ad638529) / [`0x36bc583f…`](https://pudge.explorer.nervos.org/transaction/0x36bc583f34bc903d2e736a7a7f856606373185f5d3e48bec894eb2ac875a4997) 🟢 all committed |

---

## 📂 Module Reports

- 🧩 **SSRI**: [👉 01_SSRI module report](./01_SSRI/readme.md) — 7 subs (`01_intro-talk` · `02_sdk-crates` · `03_ssri-test-prototype` · `04_ssri-server` · `05_sdk-docs` · `06_pausable-udt` · `07_audit-report`), each with `readme.md + scripts/ + images/foto-N.png`.
- 🟧 **RGB++**: [👉 02_RGB++ module report](./02_RGB++/readme.md) — 5 subs (`01_rgbpp-introduction` · `02_light-paper` · `03_resources-deployments` · `04_ccc-rgbpp-sdk` · `05_onchain-practice`), each with `readme.md + scripts/ + images/foto-N.png`.

Cross-links: SSRI-01 path table ↔ SSRI-04 live `get_methods` (8/8 match); SSRI-02 checksum ↔ SSRI-05 vendor; SSRI-06 pause cell ↔ SSRI-07 MAI-1 surface; RGB++ commitment ↔ CKB-side coin `0x36bc…`.

---

## 🛡️ Evidence Boundaries (honest scope)

| Capability | Current evidence |
|---|---|
| SSRI method-path theory | Recomputed locally, known vector ✅ + on-chain method list match |
| SSRI prototype deployment | Real Pudge tx `0x900afcf7...` (committed, 33328-byte code cell) |
| SSRI off-chain execution | 4 live calls vs prototype + 4 vs production PUDT (local VM + testnet RPC) |
| PUDT state | 6 live cells + committed pause-data cell |
| PUDT mint/transfer tx | **None — deferred**: owner lock is not the builder key |
| RGB++ commitment + SDK | Offline compute → re-verify → tamper-reject; export inventory |
| RGB++ CKB-side coin | Real Pudge tx `0x36bc…` (21M-unit xUDT, owner-lock-hash args) |
| BTC seal + SPV + full issuance | **Deferred** — needs funded BTC-testnet key + registered API token |
| Mainnet | None — testnet only |

---

## 📂 Project Structure & Navigation

```text
week7_report_builderTrack/
├── package.json (SSRI root)
├── readme.md (Master Report - You are here)
├── 01_SSRI/
│   ├── readme.md (Module report)
│   ├── 01_intro-talk/        readme + scripts/ssri_method_path_demo.js + images/foto-1.png
│   ├── 02_sdk-crates/        readme + scripts/crate_inventory_demo.js  + images/foto-2.png
│   ├── 03_ssri-test-prototype/ readme + scripts/prototype_walkthrough_demo.js + images/foto-3.png + vendor/ssri-test/
│   ├── 04_ssri-server/       readme + scripts/ssri_server_demo.js + images/foto-4.png + server-2103-compat.patch
│   ├── 05_sdk-docs/          readme + scripts/sdk_api_map_demo.js + images/foto-5.png + vendor/ckb-ssri-std-0.0.1/
│   ├── 06_pausable-udt/      readme + scripts/pausable_udt_live_demo.js + images/foto-6.png
│   └── 07_audit-report/      readme + scripts/audit_digest_demo.js + images/foto-7.png + audit PDF
└── 02_RGB++/
    ├── readme.md (Module report)
    ├── package.json (isolated deps)
    ├── 01_rgbpp-introduction/  readme + scripts/rgbpp_intro_demo.js + images/foto-1.png
    ├── 02_light-paper/         readme + scripts/lightpaper_demo.js + images/foto-2.png
    ├── 03_resources-deployments/ readme + scripts/deployments_demo.js + images/foto-3.png
    ├── 04_ccc-rgbpp-sdk/       readme + scripts/ccc_rgbpp_demo.js + images/foto-4.png
    └── 05_onchain-practice/    readme + scripts/rgbpp_coin_demo.mjs + scripts/rgbpp_verify.js + images/foto-5.png
```

## 🚀 Verification Commands

```bash
# SSRI
cd week7_report_builderTrack
npm install
node "01_SSRI/01_intro-talk/scripts/ssri_method_path_demo.js"
node "01_SSRI/02_sdk-crates/scripts/crate_inventory_demo.js"
node "01_SSRI/03_ssri-test-prototype/scripts/prototype_walkthrough_demo.js"
node "01_SSRI/04_ssri-server/scripts/ssri_server_demo.js"   # LIVE if server up, else transcript
node "01_SSRI/05_sdk-docs/scripts/sdk_api_map_demo.js"
node "01_SSRI/06_pausable-udt/scripts/pausable_udt_live_demo.js"
node "01_SSRI/07_audit-report/scripts/audit_digest_demo.js"

# RGB++ (isolated package)
cd "week7_report_builderTrack/02_RGB++"
npm install
node "01_rgbpp-introduction/scripts/rgbpp_intro_demo.js"
node "02_light-paper/scripts/lightpaper_demo.js"
node "03_resources-deployments/scripts/deployments_demo.js"
node "04_ccc-rgbpp-sdk/scripts/ccc_rgbpp_demo.js"
node "05_onchain-practice/scripts/rgbpp_verify.js"
```

---

## 🎯 Next

Handbook Advanced continues with **xUDT deep-dive** and **iCKB**; remaining user-side work is the RGB++ BTC leg (funded BTC-testnet key + API registration for full issue/transfer/leap/unlock).
