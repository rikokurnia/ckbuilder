# 🏆 Week 6 Builder Track Master Report: Nervos DAO Deep Dive & Live Lifecycle

**Name Builder**: Riko Kurnia Sandi  
**Date**: 07 October 2026  
**Track**: CKB Builder Track (Phase 2: Intermediate - Nervos DAO)

---

## 🌟 Executive Summary

This master report synthesizes the engineering, research, and live blockchain verification completed during **Week 6 (Part 1)** of the Nervos CKB Builder Track. It completes the Handbook **Nervos DAO** block: inflation-shelter economics, RFC 0023 deposit/withdraw wire format, `dao.c` system-script enforcement, and `nervdao` browser-portal reproduction.

Building on Week 4 (Script course) and Week 5 (Molecule), Week 6 proves DAO state transitions on **CKB Public Testnet (Pudge)** with the builder-track key (`ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwy0rpn3trq0sj2q6arv7xaq9w6m6xa0egxe8xvr`):

1. **Economics & Design (Blockworks)**: primary vs secondary issuance, `C|AR|S|U` header field, `AR_n/AR_m` compensation, 102 CKB min, 180-epoch cycle.
2. **RFC 0023 Deposit**: 150 CKB deposit cell (`type=DAO`, `data=0x00..00`) committed at block `#22,658,322`.
3. **dao.c + Phase 1**: same-capacity withdrawing cell (`data=#22658322 LE`) committed at block `#22,658,338`; claim epoch `14139` derived; phase-2 honestly gated.
4. **NervDAO Portal**: CCC `findCells` + `getNervosDaoInfo` + `calcDaoProfit`/`calcDaoClaimEpoch` parity with [nervdao](https://github.com/ckb-devrel/nervdao) and CCC demo; no fake claim tx.

> Scope: `01_Nervos DAO` only. `02_Spore (DOBs)` is intentionally out of scope for this report and lands next.

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

> Save terminal capture as `01_Nervos DAO/01_understanding-nervos-dao/images/foto-1.png` (run script below, screenshot).

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

## 🛡️ Evidence Boundaries (honest scope, like Week 3)

| Capability | Current evidence |
|---|---|
| DAO economics | Live tip `C|AR|S|U` + 2000-block AR growth |
| Deposit wire format | Real Pudge tx `0x9f89...` with DAO type + zero data |
| dao.c phase-1 | Real Pudge tx `0x0622...` with block-LE data + headerDeps |
| Profit / claim math | `calcDaoProfit` + `calcDaoClaimEpoch` on live headers |
| Phase-2 claim tx | **None — deferred**; `since` requires epoch `14139` (~30 days), broadcast now would fail `ERROR_INCORRECT_SINCE` |
| Spore DOBs | Out of scope (`02_Spore (DOBs)/` empty, next report) |

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
└── 02_Spore (DOBs)/ (empty - next report)
```

---

## 🎯 Next Module

With DAO deposit -> withdrawing proven and claim epoch derived (`14139`), the next Handbook block in this folder is **`02_Spore (DOBs)`** — Spore protocol, DOB cookbook, on-chain mint — plus the calendar-gated DAO phase-2 claim when `since` matures.

## 🚀 Verification Commands

```bash
cd week6_report_builderTrack
npm install
node "01_Nervos DAO/01_understanding-nervos-dao/scripts/dao_economics_demo.js"
DEPOSIT_CKB=150 node "01_Nervos DAO/02_rfc0023-deposit-withdraw/scripts/dao_deposit_demo.js"
DEPOSIT_TX_HASH=0x9f8978a24370f30254ad1c64ffcd86c9265e9994976430ef43fa7e7cf2fe7ae4 node "01_Nervos DAO/03_dao-c-system-script/scripts/dao_phase1_demo.js"
node "01_Nervos DAO/04_nervdao-portal/scripts/nervdao_portal_demo.js"
```
