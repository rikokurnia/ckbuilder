# 🚀 05 - On-Chain RGB++ Practice (Deployments + CKB-Side Coin)

> **Live Pudge proof: both Meepo-testnet script deployments hash-match docs, plus a real xUDT issuance (the CKB asset-state half of an RGB++ coin) — BTC seal leg honestly deferred**
> Handbook Advanced (RGB++): deployments + UDT hands-on, executed. BTC leg needs user-side funded BTC-testnet key + registered API token (see boundaries).

**Module**: Week 7 - RGB++ (02_RGB++)  
**Author**: Riko Kurnia Sandi  
**Official References**: [Resources](http://rgbpp.com/docs/resources) | [UDT example](https://rgbpp.com/docs/examples/udt) | [ccc rgbpp-sdk](https://github.com/ckb-devrel/ccc/tree/rgbpp-sdk)

---

## 🌟 Executive Summary

Three live Pudge facts with one builder key (`ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwy0rpn3trq0sj2q6arv7xaq9w6m6xa0egxe8xvr`):

1. **RGB++ lock deployment** (`0xf1de59e9…`, block `#12,720,748`) — on-chain type-hash recomputed locally equals docs `codeHash 0x61ca…` (`match=true`).
2. **BTC_TIME_lock deployment** (`0xde0f8787…`, block `#12,720,729`) — same check vs `0x00cd…` (`match=true`).
3. **xUDT coin issuance** (`0x36bc583f…`, block `#22,722,367`) — 21,000,000 units, type args = owner lock hash, u128 LE — the exact CKB-side asset cell an RGB++ coin issuance settles into.

BTC-testnet liveness shown free via `mempool.space` (tip `#5,158,528`, 1 sat/vB). Read-only `rgbpp_verify.js` re-proves everything without spending.

---

## 🔗 On-Chain Testnet Verification Proof

| Step | Primitive | Transaction Hash | Block | Status |
| :--- | :--- | :--- | :---: | :---: |
| RGB++ lock deploy | Meepo-testnet script cell, type-hash `0x61ca…` | [`0xf1de59e9...413e00`](https://pudge.explorer.nervos.org/transaction/0xf1de59e973b85791ec32debbba08dff80c63197e895eb95d67fc1e9f6b413e00) | `#12,720,748` | 🟢 Committed + hash MATCH |
| BTC_TIME_lock deploy | Leap script cell, type-hash `0x00cd…` | [`0xde0f8787...38529`](https://pudge.explorer.nervos.org/transaction/0xde0f87878a97500f549418e5d46d2f7704c565a262aa17036c9c1c13ad638529) | `#12,720,729` | 🟢 Committed + hash MATCH |
| xUDT coin issuance | 21M units, owner-lock-hash args, u128 LE | [`0x36bc583f...75a4997`](https://pudge.explorer.nervos.org/transaction/0x36bc583f34bc903d2e736a7a7f856606373185f5d3e48bec894eb2ac875a4997) | `#22,722,367` (`0x15ab73f`) | 🟢 Committed |

| Parameter | Value / Details |
| :--- | :--- |
| **Network** | CKB Public Testnet (Pudge) + Bitcoin Testnet3 (read-only) |
| **Signer** | `ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwy0rpn3trq0sj2q6arv7xaq9w6m6xa0egxe8xvr` |
| **xUDT type args** | `0xcd61c3a7ef0ec6542b7833d62317039a0490297bda58e01e8d28943139bcbb0f` (owner lock hash) |
| **BTC leg** | Deferred — needs funded BTC-testnet key + registered `app`/`domain` (testnet gates too) |

---

## 📸 Screenshots & Proof of Work

![RGB++ Verify Execution Proof](./images/foto-5.png)

> Save terminal capture as `05_onchain-practice/images/foto-5.png` (run verify below, screenshot). Mint capture optional as `foto-5b.png`.

---

## ⚙️ Step-by-Step Practical Execution

1. **Deploy check**: `get_transaction` both cellDeps → `committed`; recompute type-hash of `outputs[0].type` locally via CCC → equals docs `codeHash`.
2. **Coin**: xUDT known-script (`0x25c2…` on Pudge) + args = `lock.hash()` + `u128LE(21M)` → 200 CKB cell → `completeInputsByCapacity` + fee → `0x36bc…` → committed `#22722367`.
3. **BTC liveness**: mempool tip + fee rates (free). `btc-assets-api` attempted with and without `app`/`domain` → server-side `ASSETS_API_INVALID_PARAM` both ways → recorded, not bypassed.
4. **Verify (read-only)**: same three checks + mempool, exit non-zero on mismatch.

---

## 💻 Terminal Execution Output (verify — reproducible without spend)

```text
===============================================================
05 - RGB++ DEPLOYMENT + LIFECYCLE VERIFY (READ-ONLY)
===============================================================

[rgbppLock@meepo-testnet]
  deployTx : 0xf1de59e973b85791ec32debbba08dff80c63197e895eb95d67fc1e9f6b413e00
  status   : committed (VERIFIED) block #12720748
  codeHash : 0x61ca7a4796a4eb19... on-chain type-hash match=true
  explorer : https://pudge.explorer.nervos.org/transaction/0xf1de59e973b85791ec32debbba08dff80c63197e895eb95d67fc1e9f6b413e00

[btcTimeLock@meepo-testnet]
  deployTx : 0xde0f87878a97500f549418e5d46d2f7704c565a262aa17036c9c1c13ad638529
  status   : committed (VERIFIED) block #12720729
  codeHash : 0x00cdf8fab0f8ac63... on-chain type-hash match=true
  explorer : https://pudge.explorer.nervos.org/transaction/0xde0f87878a97500f549418e5d46d2f7704c565a262aa17036c9c1c13ad638529

[coin:xUDT-on-Pudge]
  tx     : 0x36bc583f34bc903d2e736a7a7f856606373185f5d3e48bec894eb2ac875a4997
  status : committed (VERIFIED) block #22722367
  explorer: https://pudge.explorer.nervos.org/transaction/0x36bc583f34bc903d2e736a7a7f856606373185f5d3e48bec894eb2ac875a4997

[btc-testnet liveness: mempool.space, free, no key]
  tip height: 5158528, fastestFee: 1 sat/vB
  btc-assets-api testnet: GATED (ASSETS_API_INVALID_PARAM without registered app/domain) — boundary, see readme.

05 Verify Complete (deployments MATCH, coin committed).
```

---

## 🚀 Reproduction Guide

```bash
cd "week7_report_builderTrack/02_RGB++"
npm install
# Read-only proof (no spend, screenshot this):
node "05_onchain-practice/scripts/rgbpp_verify.js"
# Live re-mint only for NEW xUDT types (spends testnet CKB):
node "05_onchain-practice/scripts/rgbpp_coin_demo.mjs"
```

## 🛡️ Evidence Boundaries

| Capability | Current evidence |
|---|---|
| Meepo-testnet script deployments | Real Pudge txs + local type-hash recompute MATCH docs |
| CKB-side coin (xUDT issuance) | Real Pudge tx `0x36bc…`, 21M units, content via `get_transaction` |
| BTC-testnet liveness | mempool.space tip/fees (free, no key) |
| Full RGB++ issuance (seal + SPV + CKB) | Deferred — needs funded BTC-testnet key + registered API token/origin |
| `btc-assets-api` queries | Gated server-side even on testnet; attempted twice, documented |
| Mainnet | None — testnet only |

---

## 🔗 Next

RGB++ block complete (concept → deployments → SDK → live CKB half). Remaining RGB++ work is user-side: fund a BTC-testnet key, register API `app`/`domain`, then run the issue/transfer/leap/unlock shapes from module 04 end-to-end.
