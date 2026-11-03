# 🛡️ 03 - iCKB Audit Reports: Three Findings and One Live Issue

> **ScaleBit 2024 (3 findings, 0 medium+) plus the 2026 executable review that re-checks the same commit and keeps one issue live**
> Both documents are vendored and SHA-256 pinned. The script verifies the hashes and the claims.

**Module**: Week 8 - iCKB (ickb)
**Author**: Riko Kurnia Sandi
**Official References**: [ScaleBit report](https://scalebit.xyz/reports/20240911-ICKB-Final-Audit-Report.pdf) | [2026 review](https://github.com/ickb/contracts/blob/master/ICKB-Audit-Report.md)

---

## 🌟 Executive Summary

The deployed scripts were audited in 2024 and re-checked in 2026. The headline is not "clean"; it is **"one known live issue, no fund-theft path"**.

1. **ScaleBit 2024** — 3 findings: 2 informational, 1 minor; 1 fixed, 2 acknowledged; **0 medium, major, or critical**.
2. **2026 executable review** — same commit `454cfa9`, `cargo test -p tests` passes **231 tests**, still confirms **LO-01**.
3. **LO-01** — the Limit Order confusion attack: phantom orders and fake orders can strand a real order, but cannot move the owner's principal.
4. **Deployment** — `hash_type = data1` pins the code by hash; the code cells are locked with an unspendable zero lock.
5. **Evidence** — the PDF (1.25 MB) and the 2026 review (77 KB) are vendored; both SHA-256 checks pass.

The honest boundary matters: iCKB is not unaudited, and it is not risk-free.

---

## 📋 ScaleBit 2024

| Field | Value |
| :--- | :--- |
| Auditor | ScaleBit (bitslab.xyz) |
| Timeline | 2024-09-03 .. 2024-09-10 |
| Language | Rust, CKB-VM |
| Source | `github.com/ickb/v1-core` |
| Commit | `454cfa966052a621c4e8b67001718c29ee8191a2` |
| Scope | `scripts/contracts/{ickb_logic,owned_owner,limit_order,utils}` |
| Methods | Dependency check, static analysis, manual review |

### Findings

| ID | Severity | Status | Title | Substance |
| :--- | :--- | :--- | :--- | :--- |
| **ENT-1** | Informational | Acknowledged | Busywork Attack | A large capital holder can consume near-maturity deposits, degrading service. Cost rises with pool size; no code fix. |
| **UTI-1** | Informational | Fixed | LengthNotEnough error | Incomplete data could be treated as valid; handling was tightened. |
| **ENT1-1** | Minor | Acknowledged | Confusion attack on Limit Order | An attacker can share a master cell with an existing order, confusing which order to melt. Front-end must trace lineage. |

No medium, major, or critical finding was reported.

---

## 🔬 2026 Executable Review

| Field | Value |
| :--- | :--- |
| Period | 2026-05-01 .. 2026-09-26 |
| Reviewed commit | `454cfa9` (last commit that changed `scripts/contracts/**`) |
| Evidence | `cargo test -p tests` → **231 tests, no failures** |
| Live issue | **LO-01** Limit Order confusion attack |
| Deployment | `hash_type = data1`; binaries under an unspendable zero lock |

### LO-01 in one paragraph

CKB does not execute output locks. `limit_order` runs only when a transaction creates or spends a master cell, or spends an order — a transaction that only creates order cells runs no check. Anyone can therefore create **phantom orders** (no master) or **fake orders** (pointing at someone else's live master). A fake order can trick the owner into melting it together with their master, which **strands the real order**. The attacker cannot move the principal; the owner must sign the melt. The damage is order stranding and a misleading order book, not theft.

### What the review also checked

- `iCKB Logic` has a provenance-blind path: receiptless DAO-shaped outputs can later be treated as deposits, but the tests stop at a self-funded edge case (the caller pays more than they receive).
- `Owned Owner` preserves its pairing rules under the whole-transaction-binding lock model.
- The remaining candidates are blocked paths, generic CKB model constraints, or integration boundaries.

---

## 🔐 Evidence Files

| File | Size | SHA-256 |
| :--- | :--- | :--- |
| `evidence/scalebit-ickb-audit-2024-09.pdf` | 1,252.5 KB | `3b0806477084b9872e20725f96ca0ab26cb873fa1411d0408a7bbeef87c04b61` |
| `evidence/ICKB-Audit-Report-2026.md` | 77.0 KB | `fc664915aaab858806ccf79e82f0e67ff1ca8eea50c976856acece854b27a196` |

---

## 💻 Terminal Execution Output

```text
=== 03 · iCKB Audit Reports ===
Two documents, two different jobs:
  ScaleBit 2024  independent audit of the deployed scripts
  2026 review    executable review of the same commit, with tests

ScaleBit (2024-09-10)
  Auditor        : ScaleBit (bitslab.xyz)
  Timeline       : 2024-09-03 .. 2024-09-10
  Language       : Rust, CKB-VM
  Source         : github.com/ickb/v1-core
  Commit         : 454cfa966052a621c4e8b67001718c29ee8191a2
  Scope          : scripts/contracts/{ickb_logic,owned_owner,limit_order,utils}
  Methods        : dependency check, static analysis, manual review
  Findings       : 3 total (2 informational, 1 minor, 0 medium+)

  ID       Severity       Status        Title
  ENT-1    Informational  Acknowledged  Busywork Attack
  UTI-1    Informational  Fixed         Handling of LengthNotEnough error
  ENT1-1   Minor          Acknowledged  Confusion attack on Limit Order

2026 executable review
  Period         : 2026-05-01 .. 2026-09-26
  Reviewed commit: 454cfa9 (last commit that changed the scripts)
  Evidence       : cargo test -p tests, 231 tests, no failures
  Live issue     : LO-01 Limit Order confusion attack (known, still deployed)

  LO-01 in one line:
  CKB does not execute output locks, so a transaction that only creates
  order cells runs no Limit Order check. Anyone can create phantom orders
  (no master) or fake orders (someone else's master). Melting a fake order
  with a real master strands the real order.

  Why it is not a fund-theft bug:
  the attacker cannot move the owner's principal; the owner must sign the
  melt. The damage is order stranding and a misleading order book, not theft.

Evidence files
  scalebit-ickb-audit-2024-09.pdf  1252.5 KB  sha256 3b0806477084b987...
  ICKB-Audit-Report-2026.md        77.0 KB  sha256 fc664915aaab8588...

Integrity checks
  [PASS] ScaleBit PDF matches its recorded hash
  [PASS] 2026 review matches its recorded hash
  [PASS] ScaleBit reports exactly three findings — ENT-1, UTI-1, ENT1-1
  [PASS] the 2026 review cross-references the prior audit — two informational, one minor
  [PASS] no medium, major or critical finding — 0 medium+
  [PASS] the 2026 review keeps LO-01 live — Limit Order confusion attack
  [PASS] the 2026 review records the executable test run — 231 tests
  [PASS] the deployment uses hash_type data1 — code hash pinned by data, not by type

Summary: 8/8 checks passed.
```

---

## 📸 Screenshot

![Audit report execution](./images/foto-3.png)

---

## 🚀 Reproduction Guide

```bash
cd "week8_report_builderTrack/ickb"
node "03_audit-report/scripts/ickb_audit_demo.js"
```

Offline. The script reads the two vendored files, hashes them, and checks that the review still contains the LO-01 conclusion and the 231-test evidence.

---

## 🛡️ Evidence Boundaries

| Capability | Current evidence |
|---|---|
| ScaleBit findings | Vendored PDF + SHA-256 + structured table |
| 2026 re-review | Vendored markdown + SHA-256, same commit `454cfa9` |
| Executable tests | The review records `231` tests passing; this report does not re-run Rust tests |
| LO-01 | Documented as **live**, with its limit (stranding, not theft) |
| Zero-lock binaries | Described by the 2026 review; not re-derived on-chain here |
| Mainnet | Same audited commit, but no mainnet exercise |
| Formal verification | None claimed |

---

## 🔗 Next

`04_ickb-sdk` takes the audited deployment and reads it live: same code hashes, same type script, live pool and ratio.
