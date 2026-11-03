# 🧰 04 - iCKB SDK: Reading the Live Testnet Deployment

> **The current `ickb/stack` SDK, vendored at a pinned commit, reading testnet: real code hashes, real type script, real pool, real ratio**
> Read-only. No key loaded, no transaction signed, no CKB spent.

**Module**: Week 8 - iCKB (ickb)
**Author**: Riko Kurnia Sandi
**Official References**: [stack SDK](https://github.com/ickb/stack/tree/master/sdk) | [iCKB dApp](https://ickb.org) | [CCC](https://github.com/ckb-ccc/ccc)

---

## 🌟 Executive Summary

The SDK is the bridge between the whitepaper and the chain. This sub-report proves the bridge is connected to the right deployment.

1. **Live code hash match** — xUDT `0x50bd…` and iCKB Logic `0x2a81…`, recomputed from live cell data.
2. **Eight outpoints** in the testnet dependency group, decoded from the cell, not assumed.
3. **Type script** — args = logic script hash `0xb73b…` + owner mode `0x00000080` (little-endian `0x80000000`).
4. **State read** — tip, DAO AR, fee rate, ratio, wallet cells, pool deposits, orders, all from one `getL1AccountState` call.
5. **No mint needed for this proof** — the read is enough to verify the deployment; the spend is isolated in `05`.

The snapshot run: tip `#22,804,040`, `1 iCKB = 1.1944796 CKB`, pool `380` deposits, `10` ready, order book `19` past par, wallet `80,084.9992297 CKB`.

---

## 🏗️ What the SDK Is

`ickb/stack/sdk` is a typed transaction builder, not a wallet and not a node client. It sits on CCC and owns the iCKB-specific pieces:

| Layer | Responsibility |
| :--- | :--- |
| `@ckb-ccc/core` `1.23.0` | Cells, scripts, signers, RPC, fee completion |
| `sdk/conversion` | Plans, projections, quote, fee estimation |
| `sdk/logic.ts` | Deposit and receipt cells, maturity, ready deposits |
| `sdk/udt.ts` | iCKB type script, exchange ratio, amount encoding |
| `sdk/owned_owner.ts` | Withdrawal request / owner marker pairing |
| `sdk/order` | Limit order cells, masters, ratios, matching |
| `sdk/sdk.ts` | `getL1AccountState`, `buildBaseTransaction`, `buildConversionTransaction` |

Two entry points matter for this report:

```js
const sdk = IckbSdk.fromChain("testnet");
const state = await sdk.getL1AccountState(client, [lock], WALLET_LOCK_UP);
const result = await sdk.buildConversionTransaction(tx, { direction: "ckb-to-ickb", amount, signer });
```

### The deposit cap

`ICKB_DEPOSIT_CAP = 100,000 iCKB` (about `119,447 CKB` at par). Below the cap, `ckb-to-ickb` is planned as a **limit order**, not a direct deposit. A direct live deposit therefore uses the internal `ickbLogic.deposit(...)` builder plus `sdk.completeTransaction(...)`; the public conversion path is the order-book path. `05` uses the direct path.

### Why vendored

The rewritten SDK is not on npm. `@ickb/sdk@1000.0.82` is the legacy line and is intentionally skipped. The report vendors `sdk/src` at `9582ab4` and imports it directly; the only dependency is CCC `1.23.0`.

---

## 💻 Terminal Execution Output

```text
=== 04 · iCKB SDK on Testnet ===
RPC      : https://testnet.ckb.dev/rpc
Wallet   : ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwy0rpn3trq0sj2q6arv7xaq9w6m6xa0egxe8xvr

1. Sampled chain state
  tip            : #22804040
  DAO AR         : 11936596068919962
  fee rate       : 33222 shannons/KB
  1 iCKB         : 1.1944796 CKB
  read time      : 4.3 s (tip + pool + orders + wallet)

2. Deployment code cells (live, hash_type data1)
  xUDT code      : 0x50bd8d6680b8b9cf98b73f3c08faf8b2a21914311954118ad6609be6e78a1b95
    expected     : 0x50bd8d6680b8b9cf98b73f3c08faf8b2a21914311954118ad6609be6e78a1b95  MATCH
  iCKB Logic     : 0x2a8100ab5990fa055ab1b50891702e1e895c7bd1df6322cd725c1a6115873bd3
    expected     : 0x2a8100ab5990fa055ab1b50891702e1e895c7bd1df6322cd725c1a6115873bd3  MATCH
  The hashes are computed from the live cell data, not read from constants.

3. Dependency group
  cell           : 0xf7ece4fb33d8378344cab11fcd6a4c6f382fd4207ac921cf5821f30712dcd311:0
  members        : 8
  encoded bytes  : 292 (expected 292)

4. iCKB type script
  codeHash       : 0x50bd8d6680b8b9cf98b73f3c08faf8b2a21914311954118ad6609be6e78a1b95
  hashType       : data1
  args           : 0xb73b6ab39d79390c6de90a09c96b290c331baf1798ed6f97aed02590929734e800000080
  logic code hash: 0x2a8100ab5990fa055ab1b50891702e1e895c7bd1df6322cd725c1a6115873bd3
  logic script   : 0xb73b6ab39d79390c6de90a09c96b290c331baf1798ed6f97aed02590929734e8
  owner mode     : 0x00000080 (little-endian 0x80000000)
  The args commit to the logic *script* hash, not to its code hash.
  Owners sign for their own iCKB; the mode suffix is part of the type args.

5. Account and pool
  plain CKB cells: 2, total 80084.9992297 CKB
  iCKB cells     : 0, total 0 iCKB
  receipts       : 0
  withdrawals    : 0
  pool deposits  : 380, ready now 10
  order book     : 19 orders past par
  Ready deposits can fill a withdrawal immediately; zero means wait for maturity.

6. Checks
  [PASS] xUDT code cell hashes to the configured code hash
  [PASS] iCKB Logic code cell hashes to the configured code hash
  [PASS] the dependency group decodes to eight outpoints — 8 members
  [PASS] the iCKB type args embed the logic script hash
  [PASS] the iCKB type args carry owner mode 0x80000000 — 0x00000080 little-endian
  [PASS] the exchange ratio is above par — 1 iCKB = 1.19447961 CKB
  [PASS] the SDK read the wallet's plain CKB cells — 80084.9992297 CKB
  [PASS] the testnet pool is not empty — 380 deposits

Summary: 8/8 checks passed.
Read-only: no key is loaded, no transaction is signed or sent.
```

---

## 📸 Screenshot

![SDK live read](./images/foto-4.png)

---

## 🚀 Reproduction Guide

```bash
cd "week8_report_builderTrack/ickb"
npm install
node "04_ickb-sdk/scripts/ickb_sdk_demo.mjs"
```

The values move with the chain; the checks do not. `tip`, `AR`, `ratio`, `ready`, and the order count are expected to drift.

---

## 🛡️ Evidence Boundaries

| Capability | Current evidence |
|---|---|
| Deployment identity | Live cell data hashed with `ckbhash`; MATCH both scripts |
| Type-script construction | Args = logic script hash + owner mode, checked in code |
| Dependency group | Decoded `8` outpoints from the live cell |
| SDK state read | `getL1AccountState` on testnet, including pool and orders |
| Exchange ratio | Live DAO AR + deposit delta, `1 iCKB ≈ 1.19448 CKB` |
| Deposit / mint | Not in this sub-report; see `05_deep-dive` |
| Key handling | None — no signer constructed |
| Legacy npm `1000.x` | Not used |
| Mainnet | Not exercised |

---

## 🔗 Next

`05_deep-dive` spends `1,082 CKB` on phase 1, mints iCKB in phase 2, and verifies both cells on-chain.
