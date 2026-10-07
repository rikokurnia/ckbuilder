# 🌐 04 - NervDAO Portal + CCC Lifecycle (Browser Implementation)

> **Universal wallet-interfaced DAO portal reproduced via CCC: list, profit, claim epoch, phase-2 gate**
> Repo: [ckb-devrel/nervdao](https://github.com/ckb-devrel/nervdao) | Live: [mainnet](https://www.nervdao.com/) / [testnet](https://test.nervdao.com/) | CCC demo: `packages/demo NervosDao/page.tsx`

---

## 🌟 Executive Summary

NervDAO wraps RFC 0023 + `dao.c` in a wallet-abstracted UI (MetaMask, Unisat, OKX, JoyID passkey via CCC) so holders can deposit / redeem (phase-1) / withdraw (phase-2), track rewards, and auto-compound without touching raw RPC.

We reproduced the portal flow headlessly with the builder key:

- **List**: `findCells({ script: DAO, scriptLenRange [33,34], outputDataLenRange [8,9] })` — same filter as CCC demo.
- **Info**: `cell.getNervosDaoInfo(client)` -> deposit + withdraw-request headers; `getDaoProfit` / `calcDaoProfit`; `calcDaoClaimEpoch` -> `epochToHex` for `since`.
- **Phase-1 (redeem)**: `headerDeps [depositHash]`, `outputsData blockLE` (already broadcast in module 03).
- **Phase-2 (withdraw)**: `headerDeps [withdrawHash, depositHash]`, `since absolute epoch`, `witness inputType=1 (8-byte LE)`, `completeFeeChangeToOutput` + `profit` added — **built as preview only, NOT broadcast** because tip epoch `13959` < claim `14139`.

---

## 🔗 Live State Verification (no new tx — honest gate)

| Parameter | Value / Details |
| :--- | :--- |
| **DAO cell** | `0x0622873cab21248e9e70bda8cca39b09f09b493277136dcef407ed22343eaf4d:0x0` |
| **State** | `WITHDRAWING`, data `0x12bd590100000000`, capacity `150 CKB` |
| **Deposit header** | `#22658322`, AR `11927335881881919` |
| **Withdraw-req header** | `#22658338`, AR `11927336899277601` |
| **capacityFree** | `48 CKB` |
| **Profit to date** | `0.00000409 CKB` |
| **Claim epoch** | `14139 + 385/1800`, hex `0x708018100373b` |
| **Phase-2** | Deferred: `tip 13959 < 14139`, broadcast would fail `ERROR_INCORRECT_SINCE` |
| **Portal parity** | Deposit / redeem / withdraw composers + profit/claim helpers match nervdao + CCC demo |

---

## 📸 Screenshots & Proof of Work

> Save terminal capture as `./images/foto-4.png`. Optional: capture https://test.nervdao.com/ showing same DAO cell.

---

## 💻 Terminal Execution Output

```text
=================================================================
🟢 WEEK6-04: NERVDAO PORTAL + CCC DAO LIFECYCLE REPRODUCTION
=================================================================
🔍 Scanning DAO cells owned by signer (like nervdao.com + ccc demo)...
   Found 1 DAO cell(s) (capped at 10 for report)
   Tip #22658344 epoch=13959+407/1800 AR=11927337280800948
--- DAO cell [0] 0x0622873cab21248e...:0 ---
   capacity: 150 CKB
   data    : 0x12bd590100000000 (WITHDRAWING (phase-2 pending))
   deposit block #22658322 epoch=13959+385/1800
   capacityFree (c_t - occupied): 48 CKB
   profit vs tip/req            : 0.00000409 CKB
   claim epoch (calcDaoClaimEpoch): integer=14139 numerator=385 denominator=1800
   claim hex (epochToHex)         : 0x708018100373b
🧪 Phase-2 preview (withdraw -> claim, NOT broadcast):
   required since (absolute epoch): 0x708018100373b
   ⛔ Gate: tip epoch < claim epoch, so phase-2 tx would fail with ERROR_INCORRECT_SINCE.
🏁 Week6-04 Portal Check Complete!
```

---

## 🚀 Reproduction Guide

```bash
cd week6_report_builderTrack
node "01_Nervos DAO/04_nervdao-portal/scripts/nervdao_portal_demo.js"
# UI parity (manual):
# 1. Open https://test.nervdao.com/, connect wallet, find same 150 CKB cell
# 2. Compare profit + claim countdown vs script output above
```
