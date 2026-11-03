# 🏦 02 - RFC 0023 Deposit: DAO Deposit Cell on Testnet

> **Deposit wire format + live Pudge broadcast: type=NervosDAO, data=8 zero bytes, cell_deps=DAO**
> Official spec: [RFC 0023 Deposit and Withdraw](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0023-dao-deposit-withdraw/0023-dao-deposit-withdraw.md)

---

## 🌟 Executive Summary

RFC 0023 defines a **deposit cell** as any output with (1) Nervos DAO type script (`code_hash 0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e`, `hash_type type`, `args 0x`) and (2) 8-byte zero cell data. No limit per tx. Validation requires DAO `cell_dep` inclusion.

In this module we built and broadcast a **150 CKB deposit** from the builder-track key, following the CCC demo / nervdao deposit composer (`Script.fromKnownScript` + `addCellDepsOfKnownScripts` + `completeInputsByCapacity` + `completeFeeBy`).

---

## 🔗 On-Chain Testnet Verification Proof

| Parameter | Value / Details |
| :--- | :--- |
| **Network** | CKB Public Testnet (Pudge) |
| **Transaction Hash** | [`0x9f8978a24370f30254ad1c64ffcd86c9265e9994976430ef43fa7e7cf2fe7ae4`](https://pudge.explorer.nervos.org/transaction/0x9f8978a24370f30254ad1c64ffcd86c9265e9994976430ef43fa7e7cf2fe7ae4) |
| **Block Number** | `22,658,322` (`0x159bd12`) |
| **Block Hash** | `0x84e636ce15c1e1a79eee26cb57805f0d6083cb31fdfd1800cd5bc69fc776d94c` |
| **Deposit Output** | index `0`, capacity `150 CKB (0x37e11d600)`, data `0x0000000000000000` |
| **Epoch @ deposit** | `13959 + 385/1800` |
| **DAO AR @ deposit** | `11927335881881919 (1.192733588188)` |
| **Sender** | `ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwy0rpn3trq0sj2q6arv7xaq9w6m6xa0egxe8xvr` |
| **Status** | 🟢 `committed` |
| **Explorer** | [🔍 Inspect deposit tx](https://pudge.explorer.nervos.org/transaction/0x9f8978a24370f30254ad1c64ffcd86c9265e9994976430ef43fa7e7cf2fe7ae4) |

---

## 📸 Screenshots & Proof of Work

> Save terminal capture as `./images/foto-2.png`.

---

## ⚙️ Step-by-Step Practical Execution

1. **Lock resolution**: standard SECP256K1-BLAKE160 (`0x9bd7e06f...da3cce8`, args `0xc478c338...dd7e5`).
2. **DAO type**: `Script.fromKnownScript(client, KnownScript.NervosDao, "0x")` -> testnet cell_dep `0x8f8c79eb...2635c9f:0x2`.
3. **Outputs**: `[{ lock, type: DAO }]` + `outputsData ["00"*8]`; capacity set to `150 CKB` (>= 102 occupied guard).
4. **Complete + fee**: `completeInputsByCapacity` + `completeFeeBy(1500)`; change output auto-added.
5. **Broadcast + poll**: `sendTransaction` -> poll `get_transaction` until `committed`, fetch deposit header for AR/epoch proof.

## 💻 Terminal Execution Output

```text
=================================================================
🟢 WEEK6-02: RFC 0023 DAO DEPOSIT - ON-CHAIN TESTNET VERIFICATION
=================================================================
👤 Signer Address: ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwy0rpn3trq0sj2q6arv7xaq9w6m6xa0egxe8xvr
🏛️ DAO type script (RFC 0023):
   code_hash: 0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e
   data     : 0x0000000000000000 (8 zero bytes = deposit cell)
   • Output capacity: 150 CKB
🎉 DEPOSIT BROADCAST SUCCESSFUL!
🔗 Transaction Hash: 0x9f8978a24370f30254ad1c64ffcd86c9265e9994976430ef43fa7e7cf2fe7ae4
🌐 Explorer: https://pudge.explorer.nervos.org/transaction/0x9f8978a24370f30254ad1c64ffcd86c9265e9994976430ef43fa7e7cf2fe7ae4
✅ Committed in block #22658322 (raw 0x159bd12)
   Block hash        : 0x84e636ce15c1e1a79eee26cb57805f0d6083cb31fdfd1800cd5bc69fc776d94c
   Epoch             : integer=13959 index=385/1800
   DAO AR @ deposit  : 11927335881881919 (1.192733588188)
🏁 Week6-02 Deposit Complete!
```

---

## 🚀 Reproduction Guide

```bash
cd week6_report_builderTrack
DEPOSIT_CKB=150 node "01_Nervos DAO/02_rfc0023-deposit-withdraw/scripts/dao_deposit_demo.js"
```
