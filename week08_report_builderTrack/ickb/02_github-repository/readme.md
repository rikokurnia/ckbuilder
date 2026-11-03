# 🗂️ 02 - iCKB GitHub Repositories: Where the Code Lives

> **Three maintained repos, one pinned SDK snapshot, five script hashes verified against `constants.ts` — no guessing which branch is current**
> Offline by default. `--live` optionally compares the three heads against GitHub.

**Module**: Week 8 - iCKB (ickb)
**Author**: Riko Kurnia Sandi
**Official References**: [whitepaper](https://github.com/ickb/whitepaper) | [contracts](https://github.com/ickb/contracts) | [stack](https://github.com/ickb/stack)

---

## 🌟 Executive Summary

iCKB is not one repository. The spec, the L1 scripts, and the current SDK are separate, and the SDK is not the npm package most people find first.

This sub-report pins the map:

1. **`ickb/whitepaper`** — protocol math and lifecycle (`master`, `3e0ffbd`, 2026-09-26).
2. **`ickb/contracts`** — the four Rust scripts (`master`, `c951927`, 2026-09-26), audited at `454cfa9`.
3. **`ickb/stack`** — the current SDK, dApp, and testkit (`master`, `9582ab4`, 2026-10-15).
4. **Vendored SDK** — `stack/sdk/src` at `9582ab4`, 32 files, MIT, imported directly.
5. **Deployment constants** — three testnet outpoints and five code hashes all present in `constants.ts`.

All six integrity checks pass. The legacy npm `1000.x` line is out of scope by decision; the report uses the current source, not the published legacy package.

---

## 🧭 Repository Map

| Repository | Branch | Head | Date | Role |
| :--- | :--- | :--- | :--- | :--- |
| `ickb/whitepaper` | `master` | `3e0ffbd` | 2026-09-26 | Protocol specification, deposit/withdrawal math |
| `ickb/contracts` | `master` | `c951927` | 2026-09-26 | L1 scripts in Rust, audited at `454cfa9` |
| `ickb/stack` | `master` | `9582ab4` | 2026-10-15 | Current SDK, interface, testkit, scripts |

`main` is not the default branch in any of the three. `raw.githubusercontent.com/.../main/README.md` returns 404; use `master`.

### `ickb/contracts` — `scripts/contracts`

| Script | Role | Why it matters |
| :--- | :--- | :--- |
| `ickb_logic` | lock + type | Holds DAO deposits and types receipts |
| `owned_owner` | lock | Holds withdrawal requests until paired with owned iCKB |
| `limit_order` | lock | Matches deposits and withdrawals without the 180-epoch wait |
| `utils` | library | Shared encoders and witness helpers |

Each script runs in two roles, and whenever it runs it validates every cell in the transaction that uses it. That whole-transaction model is what makes the audit findings in `03` interesting.

### `ickb/stack`

| Directory | Role |
| :--- | :--- |
| `sdk/` | Typed transaction builders — the only part vendored here |
| `interface/` | React dApp |
| `testkit/` | Devnet fixtures and assertions |
| `scripts/` | Workspace tooling |

The rewritten SDK is **not published on npm**. The published `@ickb/sdk@1000.0.82` is the legacy line. This report vendors `sdk/src` at a pinned commit and imports it from `lib/ickb-sdk/`, so every result is tied to a readable source tree.

---

## 🔐 Provenance

```text
lib/ickb-sdk/          <- ickb/stack/sdk/src @ 9582ab441e64aff304a3af2be70e86713a645169
lib/ickb-sdk/LICENSE   <- MIT
lib/ickb-sdk/PROVENANCE.md
```

The vendored tree has no build step. Node 26 type-stripping imports the `.ts` files directly; the only runtime dependency is `@ckb-ccc/core@1.23.0`.

---

## 💻 Terminal Execution Output

```text
=== 02 · iCKB GitHub Repositories ===
Snapshot: 2026-10-20. All checks below are local and offline.

Repository map
  ickb/whitepaper  master  3e0ffbd  2026-09-26
    protocol specification, deposit and withdrawal math
  ickb/contracts  master  c951927  2026-09-26
    L1 scripts in Rust, audited at 454cfa9
  ickb/stack  master  9582ab4  2026-10-15
    current SDK, interface, testkit, scripts

Contracts: scripts/contracts
  ickb_logic   lock     holds DAO deposits and types receipts
  owned_owner  lock     holds withdrawal requests until they are paired with owned iCKB
  limit_order  lock     matches deposits and withdrawals without waiting 180 epochs
  utils        library  shared helpers for the three scripts
  Audited commit: 454cfa9 (see 03_audit-report)

Current stack layout
  sdk/        typed transaction builders (the only part vendored here)
  interface/  React dApp
  testkit/    devnet fixtures and assertions
  scripts/    workspace tooling

Testnet deployment
  xUDT code cell      0xbf6fb538763efec2a70a6a3dcb7242787087e1030c4e7d86585bc63a9d337f5f
  iCKB Logic code     0x9ac989b3355764f76cdce02c69dedb819fdfbcbda49a7db1a2c9facdfdb9a7fe
  dep group           0xf7ece4fb33d8378344cab11fcd6a4c6f382fd4207ac921cf5821f30712dcd311

Integrity checks
  [PASS] vendored SDK is pinned to the stack HEAD in the snapshot — 9582ab4
  [PASS] all three testnet code cells are present in constants.ts — udtCode, logicCode, depGroup
  [PASS] all five script code hashes are present in constants.ts — xUDT, iCKB Logic, Owned Owner, Limit Order, DAO
  [PASS] mainnet deployment is present for parity — mainnet udtCode + logicCode
  [PASS] vendored SDK contains the full source tree — 32 files
  [PASS] the snapshot covers exactly the three maintained repos

Summary: 6/6 checks passed.
```

---

## 📸 Screenshot

![Repository map execution](./images/foto-2.png)

---

## 🚀 Reproduction Guide

```bash
cd "week8_report_builderTrack/ickb"
node "02_github-repository/scripts/ickb_repo_demo.js"
# optional: compare the pinned heads with GitHub (network)
node "02_github-repository/scripts/ickb_repo_demo.js" --live
```

The default run is fully offline. `--live` is a convenience check; a moved head does not invalidate the pinned evidence.

---

## 🛡️ Evidence Boundaries

| Capability | Current evidence |
|---|---|
| Three maintained repos | Heads, dates, and roles recorded in the snapshot |
| Current SDK source | Vendored at `9582ab4`, 32 files, MIT, provenance file |
| Deployment constants | Present in `constants.ts`; live hash-match proven in `04` |
| Legacy npm `1000.x` | Deliberately not covered |
| GitHub liveness | Snapshot by default; `--live` optional |
| 2024 audit source URL | The PDF names `ickb/v1-core`; the 2026 review re-checks the same commit inside `ickb/contracts` |
| Mainnet | Present in constants for parity, not exercised |

---

## 🔗 Next

`03_audit-report` reads the two security documents that cover `454cfa9`, including the one issue that is still live.
