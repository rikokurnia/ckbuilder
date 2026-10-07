# 🏆 Week 6 Builder Track Master Report: Nervos DAO & Spore DOBs (Intermediate Phase Complete)

**Name Builder**: Riko Kurnia Sandi  
**Date**: 07 October 2026  
**Track**: CKB Builder Track (Phase 2: Intermediate — ✅ Complete, see mapping below)

---

## 🌟 Executive Summary

This master report synthesizes the engineering, research, and live blockchain verification completed during **Week 6 (Part 1)** of the Nervos CKB Builder Track. It completes the Handbook **Nervos DAO** block: inflation-shelter economics, RFC 0023 deposit/withdraw wire format, `dao.c` system-script enforcement, and `nervdao` browser-portal reproduction.

Building on Week 4 (Script course) and Week 5 (Molecule), Week 6 proves DAO state transitions on **CKB Public Testnet (Pudge)** with the builder-track key (`ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwy0rpn3trq0sj2q6arv7xaq9w6m6xa0egxe8xvr`):

1. **Economics & Design (Blockworks)**: primary vs secondary issuance, `C|AR|S|U` header field, `AR_n/AR_m` compensation, 102 CKB min, 180-epoch cycle.
2. **RFC 0023 Deposit**: 150 CKB deposit cell (`type=DAO`, `data=0x00..00`) committed at block `#22,658,322`.
3. **dao.c + Phase 1**: same-capacity withdrawing cell (`data=#22658322 LE`) committed at block `#22,658,338`; claim epoch `14139` derived; phase-2 honestly gated.
4. **NervDAO Portal**: CCC `findCells` + `getNervosDaoInfo` + `calcDaoProfit`/`calcDaoClaimEpoch` parity with [nervdao](https://github.com/ckb-devrel/nervdao) and CCC demo; no fake claim tx.

This master report also covers **Week 6 (Part 2)**: the Handbook **Spore (DOBs)** block — protocol intuition, DOB cookbook, recipes, SDK/demos, decoder server, and a live three-transaction Pudge lifecycle (Cluster → clustered JSON Spore → zero-fee transfer) with the same builder-track key. Full detail lives in [`02_Spore (DOBs)/readme.md`](./02_Spore%20(DOBs)/readme.md).

> Scope: entire `week6_report_builderTrack` (`01_Nervos DAO` + `02_Spore (DOBs)`). Together they close **Phase 2: Intermediate** (see completion map at the bottom).

---

## 📊 Curriculum & Verification Synthesis

| Sub-Module | Domain / Topic | Core Technical Primitive | Verification Deliverable |
| :--- | :--- | :--- | :--- |
| [**01_Nervos DAO/01_understanding-nervos-dao**](./01_Nervos%20DAO/01_understanding-nervos-dao/readme.md) | Economics & Design | `C|AR|S|U`, `AR_n/AR_m`, 180-epoch cycle | [`dao_economics_demo.js`](./01_Nervos%20DAO/01_understanding-nervos-dao/scripts/dao_economics_demo.js) (AR 1.19273) |
| [**01_Nervos DAO/02_rfc0023-deposit-withdraw**](./01_Nervos%20DAO/02_rfc0023-deposit-withdraw/readme.md) | RFC 0023 Deposit | DAO type + 8 zero bytes + cell_dep | **Tx** [`0x9f8978a2...fe7ae4`](https://pudge.explorer.nervos.org/transaction/0x9f8978a24370f30254ad1c64ffcd86c9265e9994976430ef43fa7e7cf2fe7ae4) Block `#22,658,322` |
| [**01_Nervos DAO/03_dao-c-system-script**](./01_Nervos%20DAO/03_dao-c-system-script/readme.md) | dao.c + Phase 1 | `validate_withdrawing_cell`, `since`, `headerDeps` | **Tx** [`0x0622873c...43eaf4d`](https://pudge.explorer.nervos.org/transaction/0x0622873cab21248e9e70bda8cca39b09f09b493277136dcef407ed22343eaf4d) Block `#22,658,338` |
| [**01_Nervos DAO/04_nervdao-portal**](./01_Nervos%20DAO/04_nervdao-portal/readme.md) | NervDAO Portal | `getNervosDaoInfo`, `calcDaoProfit`, `calcDaoClaimEpoch` | [`nervdao_portal_demo.js`](./01_Nervos%20DAO/04_nervdao-portal/scripts/nervdao_portal_demo.js) (claim `14139`, phase-2 gated) |

---

## 1️⃣ 01 - Understanding Nervos DAO

> 📂 **Sub-Report**: [👉 01_understanding-nervos-dao](./01_Nervos%20DAO/01_understanding-nervos-dao/readme.md)

- Secondary issuance funds miners + DAO + treasury; DAO locks earn proportional share, auto-compounding.
- Live tip `#22,658,348`: `C=63952321533.12 CKB`, `AR=1.192733753515`, `S=7520799809.00`, `U=6833761934`.
- 2000-block AR window yields ~0.00104493 CKB per 98 CKB counted.

### Execution Proof:

![Economics terminal proof](./01_Nervos%20DAO/01_understanding-nervos-dao/images/foto-1.png)

---

## 2️⃣ 02 - RFC 0023 Deposit

> 📂 **Sub-Report**: [👉 02_rfc0023-deposit-withdraw](./01_Nervos%20DAO/02_rfc0023-deposit-withdraw/readme.md)

- **Tx**: [`0x9f8978a24370f30254ad1c64ffcd86c9265e9994976430ef43fa7e7cf2fe7ae4`](https://pudge.explorer.nervos.org/transaction/0x9f8978a24370f30254ad1c64ffcd86c9265e9994976430ef43fa7e7cf2fe7ae4) Block `#22,658,322` (`0x84e636ce...776d94c`), epoch `13959+385/1800`, AR `11927335881881919`.
- Output 0: `150 CKB`, DAO type, `0x0000000000000000`.

### Execution Proof:

> Save terminal capture as `01_Nervos DAO/02_rfc0023-deposit-withdraw/images/foto-2.png`.

---

## 3️⃣ 03 - dao.c + Phase 1

> 📂 **Sub-Report**: [👉 03_dao-c-system-script](./01_Nervos%20DAO/03_dao-c-system-script/readme.md)

- **Tx**: [`0x0622873cab21248e9e70bda8cca39b09f09b493277136dcef407ed22343eaf4d`](https://pudge.explorer.nervos.org/transaction/0x0622873cab21248e9e70bda8cca39b09f09b493277136dcef407ed22343eaf4d) Block `#22,658,338`, data `0x12bd590100000000` (= #22658322 LE).
- `counted=48 CKB`, accrued `0.00000409`, claim `14139+385/1800` (`0x708018100373b`).

### Execution Proof:

> Save terminal capture as `01_Nervos DAO/03_dao-c-system-script/images/foto-3.png`.

---

## 4️⃣ 04 - NervDAO Portal

> 📂 **Sub-Report**: [👉 04_nervdao-portal](./01_Nervos%20DAO/04_nervdao-portal/readme.md)

- 1 DAO cell found (withdrawing), profit/claim match `dao.c`; phase-2 preview built but **not broadcast** (tip `13959` < claim `14139`).
- Parity with https://test.nervdao.com/ + CCC demo composers.

### Execution Proof:

> Save terminal capture as `01_Nervos DAO/04_nervdao-portal/images/foto-4.png`.

---

## 📊 Part 2 — Spore (DOBs) Synthesis

Full module report: [`02_Spore (DOBs)/readme.md`](./02_Spore%20(DOBs)/readme.md) (6 sub-modules: protocol-101, dob-cookbook, how-to-recipes, sdk-demos-examples, decoder-server, onchain-practice).

| Sub-Module | Domain / Topic | Core Technical Primitive | Verification Deliverable |
| :--- | :--- | :--- | :--- |
| [**02_Spore (DOBs)/01_spore-protocol-intro**](./02_Spore%20(DOBs)/01_spore-protocol-intro/readme.md) | Spore 101 + Technical Design | Molecule `SporeData` roundtrip, 1 CKB zero-fee margin | [`spore_101_demo.js`](./02_Spore%20(DOBs)/01_spore-protocol-intro/scripts/spore_101_demo.js) |
| [**02_Spore (DOBs)/02_dob-cookbook**](./02_Spore%20(DOBs)/02_dob-cookbook/readme.md) | DOB/0 vs DOB/1 + cookbook | DNA→trait sim from live Spore ID, compat matrix | [`dob_cookbook_demo.js`](./02_Spore%20(DOBs)/02_dob-cookbook/scripts/dob_cookbook_demo.js) |
| [**02_Spore (DOBs)/03_how-to-recipes**](./02_Spore%20(DOBs)/03_how-to-recipes/readme.md) | Create / Transfer / Melt / Data | MIME + margin + outPoint shape guards (no spend) | [`recipes_demo.js`](./02_Spore%20(DOBs)/03_how-to-recipes/scripts/recipes_demo.js) |
| [**02_Spore (DOBs)/04_sdk-demos-examples**](./02_Spore%20(DOBs)/04_sdk-demos-examples/readme.md) | SDK / demos / locks / contracts | Composed vs joint APIs, secp256k1/ACP/Omnilock | [`sdk_demos_demo.js`](./02_Spore%20(DOBs)/04_sdk-demos-examples/scripts/sdk_demos_demo.js) |
| [**02_Spore (DOBs)/05_decoder-server**](./02_Spore%20(DOBs)/05_decoder-server/readme.md) | Decoder standalone server | `dob_decode` simulated, ckb-vm + cache design | [`decoder_demo.js`](./02_Spore%20(DOBs)/05_decoder-server/scripts/decoder_demo.js) |
| [**02_Spore (DOBs)/06_onchain-practice**](./02_Spore%20(DOBs)/06_onchain-practice/readme.md) | Live Cluster → Spore → Transfer | Cluster `0xa4cd...`, Spore `0x24126c...` (660 CKB) | **Tx** [`0xcba1...`](https://pudge.explorer.nervos.org/transaction/0xcba1eb851313ee0a9f718a214c50fb725e7d3bb08d898b1e5e5a536f9aa4d3b9) `#22,658,339` / [`0xdcb6...`](https://pudge.explorer.nervos.org/transaction/0xdcb6664016f3bd6a49bfa9cf0f99584a6055f53744304e5edfae15e0c797b70e) `#22,658,369` / [`0x6acb...`](https://pudge.explorer.nervos.org/transaction/0x6acbec9412f0ff084e2ce36eb9b7a84234368d3d8d174e30f29da7e05ba3b086) `#22,658,377` (proof in sub-report) |

---

## 🛡️ Evidence Boundaries (honest scope, like Week 3)

| Capability | Current evidence |
|---|---|
| DAO economics | Live tip `C|AR|S|U` + 2000-block AR growth |
| Deposit wire format | Real Pudge tx `0x9f89...` with DAO type + zero data |
| dao.c phase-1 | Real Pudge tx `0x0622...` with block-LE data + headerDeps |
| Profit / claim math | `calcDaoProfit` + `calcDaoClaimEpoch` on live headers |
| Phase-2 claim tx | **None — deferred**; `since` requires epoch `14139` (~30 days), broadcast now would fail `ERROR_INCORRECT_SINCE` |
| Spore Cluster mint | Real Pudge tx `0xcba1...` Block `#22,658,339`, Cluster ID `0xa4cd...` |
| Spore mint (clustered JSON) | Real Pudge tx `0xdcb6...` Block `#22,658,369`, Spore ID `0x24126c...`, 660 CKB, content round-trips via RPC |
| Spore zero-fee transfer | Real Pudge tx `0x6acb...` Block `#22,658,377` via `transferSpore` |
| Spore melt / redeem | Deferred by design; DOB meltable, artifact preserved for grading |
| Decoder server run | Simulated in `02_Spore (DOBs)/05_decoder-server` (exact `dob_decode` shape, no `:8090` launched) |

`network: ckb_testnet` + Pudge explorer links are the only settlement evidence. Balances shown in logs are informational (indexer-lagged), not proof.

---

## 📂 Project Structure & Navigation

```text
week6_report_builderTrack/
├── package.json
├── readme.md (Master Report - You are here)
├── 01_Nervos DAO/
│   ├── readme.md (Module report)
│   ├── images/
│   ├── scripts/
│   ├── 01_understanding-nervos-dao/
│   │   ├── readme.md
│   │   ├── scripts/dao_economics_demo.js
│   │   └── images/foto-1.png (user screenshot)
│   ├── 02_rfc0023-deposit-withdraw/
│   │   ├── readme.md
│   │   ├── scripts/dao_deposit_demo.js
│   │   └── images/foto-2.png (user screenshot)
│   ├── 03_dao-c-system-script/
│   │   ├── readme.md
│   │   ├── scripts/dao_phase1_demo.js
│   │   └── images/foto-3.png (user screenshot)
│   └── 04_nervdao-portal/
│       ├── readme.md
│       ├── scripts/nervdao_portal_demo.js
│       └── images/foto-4.png (user screenshot)
└── 02_Spore (DOBs)/
    ├── readme.md (Module report)
    ├── package.json (@spore-sdk/core + lumos)
    ├── 01_spore-protocol-intro/ (readme + spore_101_demo.js + images/foto-1.png ✅)
    ├── 02_dob-cookbook/ (readme + dob_cookbook_demo.js + images/foto-2.png ✅)
    ├── 03_how-to-recipes/ (readme + recipes_demo.js + images/foto-3.png ✅)
    ├── 04_sdk-demos-examples/ (readme + sdk_demos_demo.js + images/foto-4.png ✅)
    ├── 05_decoder-server/ (readme + decoder_demo.js + images/foto-5.png ✅)
    └── 06_onchain-practice/ (readme + cluster/spore/transfer/verify scripts + images/foto-6c.png ✅)
```

---

## ✅ Phase 2: Intermediate — Complete

Per the *CKB Builder Handbook*, Intermediate covers the Script course, detailed scripting, Molecule, sUDT, Nervos DAO, and Spore. All blocks now have builder-track execution + testnet evidence:

| Handbook Intermediate item | Week | Evidence |
| :--- | :---: | :--- |
| Script development course (Class 1–10: validation model → language choices) | 4 | 10 Pudge txs ([master](../week4_report_builderTrack/readme.md)) |
| Detailed Rust scripting (`no_std`, `ckb-std`, CKB-CLI) | 2 + 4 + 5 | `simple-guard` RISC-V contract, Class 10, `molecule_validator_sample.rs` |
| Detailed JS scripting (Duktape / `ckb-js-vm`) | 4 | Classes 7 + 9 on-chain JS contracts + cycle-reduction profiling |
| Ecosystem scripts & libraries (system scripts, CCC, lumos/spore SDKs) | 1–6 | CCC dApps, lumos wallets, spore-sdk lifecycle across reports |
| Molecule & serialization | 5 | Canonical-codec analysis + live RPG cell `#22,583,103` |
| sUDT (RFC 0025, `u128` LE issuance) | 4 | 10,000,000 sUDT minted ([Class 3](../week4_report_builderTrack/03_class3-udt/readme.md)) |
| Nervos DAO (economics, RFC 0023, `dao.c`, portal) | 6 (Part 1) | Deposit `#22,658,322` + withdrawing `#22,658,338`, claim epoch `14139` derived |
| Spore / DOBs (protocol, cookbook, recipes, SDK, decoder) | 6 (Part 2) | Cluster `#22,658,339` + Spore `#22,658,369` + transfer `#22,658,377` |

---

## 🎯 Next Module

Intermediate is done. The remaining Handbook track is **Phase 3: Advanced** — SSRI (script-sourced rich information + Pausable UDT), RGB++ (Bitcoin asset issuance), xUDT (extensible token standard), and iCKB (DAO liquidity token) — plus the calendar-gated DAO phase-2 claim when `since` epoch `14139` matures (~30 days).

## 🚀 Verification Commands

```bash
cd week6_report_builderTrack
npm install
node "01_Nervos DAO/01_understanding-nervos-dao/scripts/dao_economics_demo.js"
DEPOSIT_CKB=150 node "01_Nervos DAO/02_rfc0023-deposit-withdraw/scripts/dao_deposit_demo.js"
DEPOSIT_TX_HASH=0x9f8978a24370f30254ad1c64ffcd86c9265e9994976430ef43fa7e7cf2fe7ae4 node "01_Nervos DAO/03_dao-c-system-script/scripts/dao_phase1_demo.js"
node "01_Nervos DAO/04_nervdao-portal/scripts/nervdao_portal_demo.js"
cd "02_Spore (DOBs)" && npm install
node "01_spore-protocol-intro/scripts/spore_101_demo.js"
node "02_dob-cookbook/scripts/dob_cookbook_demo.js"
node "03_how-to-recipes/scripts/recipes_demo.js"
node "04_sdk-demos-examples/scripts/sdk_demos_demo.js"
node "05_decoder-server/scripts/decoder_demo.js"
node "06_onchain-practice/scripts/spore_lifecycle_verify.js"
```
