# Week 8 Builder Track Master Report: iCKB + xUDT

**Name Builder**: Riko Kurnia Sandi  
**Date**: 20 October 2026  
**Track**: CKB Builder Track (Phase 3: Advanced - iCKB + xUDT)

---

## Executive Summary

This master report synthesizes the research, engineering, and live verification completed during **Week 8** of the Nervos CKB Builder Track. It completes **two** Handbook Advanced blocks in parallel, each ending with a real committed transaction on Pudge testnet.

### Part 1 — iCKB (liquid Nervos DAO staking)

iCKB turns a Nervos DAO deposit into a liquid, transferable token. The deposit still earns DAO interest; the receipt and the iCKB token make it usable before the 180-epoch unlock ([module report](./ickb/readme.md)):

1. **Whitepaper**: the lifecycle re-derived offline, 6/6 — `1,082 CKB` → `1,000 CKB` free → `837.19 iCKB` at the snapshot ratio, exit after 180 epochs, 2% oversized-deposit fee.
2. **Repositories**: three maintained repos (`whitepaper`, `contracts`, `stack`) pinned to real commits (`3e0ffbd`, `c951927`, `9582ab4`); five script hashes checked against `constants.ts`.
3. **Audit**: ScaleBit 2024 (3 findings, none medium+) plus a 2026 executable review of the same commit — **LO-01 is still live** (limit-order confusion can strand orders; no principal theft).
4. **SDK**: `ickb/stack/sdk` vendored at `9582ab4` (not on npm); live read of testnet: contract code hashes MATCH, 8-member dep group, pool `380` deposits, ratio `1.1944796`.
5. **Deep dive**: real spend — [deposit `0x631c8b4a…`](https://pudge.explorer.nervos.org/transaction/0x631c8b4ae65aa456006472e526b89c0047869e8e40fdbfa331d8621dd6d05371) at block `#22,804,094` and [mint `0x4dd5c139…`](https://pudge.explorer.nervos.org/transaction/0x4dd5c139ade7638a6bac605e64b652a512fc8b9188c9fa3d5e5d9762d41aa08e) at block `#22,804,097`, **17/17** independent verifier checks.

The live anchor: a `1,082 CKB` deposit cell (still live), the receipt consumed, **`837.7595312 iCKB`** minted at header AR `11,936,599,498,468,556`.

### Part 2 — xUDT (extendable UDT)

xUDT keeps sUDT's `amount` + owner-lock-compatible type args and appends a `ScriptVec` of extension code cells that run inside the same validation loop ([module report](./xudt/readme.md)):

1. **Data model**: a live 21,000,000-unit legacy xUDT cell decoded (32-byte owner + `flags=0`), side by side with the new 113-byte extension args (owner + flags + one `ScriptVec` entry).
2. **Validation lifecycle**: owner mode, supply conservation, then extensions — reproduced as a decision matrix and cross-checked against the exact order in the upstream `xudt_rce.c`.
3. **Programmability**: a custom extension written in C (`transfer_cap.c`: cap the sum of non-sender group outputs, owner mode always bypasses), compiled as an `ET_DYN` `.so`, deployed as a code cell, and executed live by the deployed xUDT script through `ckb_dlopen2`.
4. **Live outcomes**: owner mint of 2,000 units (`0xfa37c118…`), a 500-unit transfer accepted (`0xfff23bd1…`), and a 1,200-unit transfer rejected by CKB-VM with **`-104`** from `Inputs[0].Type`.
5. **RFC conformance**: `rfc_conformance_check.js` re-derives the executed RFC-0052 clauses from chain state: **8 PASS, 5 DEFERRED, 0 FAIL**.

The engineering work also produced two reusable findings about the CKB extension loader, all five deployment attempts pinned as committed cells (full timeline in module 03):

- A static `ET_EXEC` has no `.dynsym` / `.dynstr`, so `ckb_dlopen2` rejects it with `-22` (`ERROR_INVALID_ELF`). The extension must be a dynamic `ET_DYN` object.
- The executable `PT_LOAD` must start on a page boundary. LLD's default shared-library layout placed `.text` in a separate RX segment at `p_offset=0x23a`, `p_vaddr=0x123a`; the loaded symbol landed in zeroed memory and CKB-VM raised `InvalidInstruction`. Linking with `--no-rosegment` (and `-z norelro`) merges headers, `.dynsym`, `.dynstr`, and `.text` into one RX `PT_LOAD` at offset `0` / vaddr `0`, which the loader handles correctly.

The final build is bit-reproducible: a fresh `./build.sh` produces a `transfer_cap.so` byte-identical to the live code cell.

All claims below are testnet-only.

---

## Module Reports

### iCKB

| # | Sub-module | Question it answers | Main evidence |
|---|---|---|---|
| 01 | [Whitepaper](./ickb/01_whitepaper/readme.md) | How does the two-phase mint work? | `ickb_whitepaper_demo.js` — 6/6 offline lifecycle math |
| 02 | [GitHub repository](./ickb/02_github-repository/readme.md) | Which code is the source of truth? | Three repos pinned; 5 script hashes vs `constants.ts` — 6/6 |
| 03 | [Audit report](./ickb/03_audit-report/readme.md) | What can go wrong? | ScaleBit 2024 + 2026 review: LO-01 still live — 8/8 |
| 04 | [iCKB SDK](./ickb/04_ickb-sdk/readme.md) | Is the deployed system what the source says? | Vendored SDK reads testnet live — 8/8 |
| 05 | [Deep dive](./ickb/05_deep-dive/readme.md) | Does the two-phase mint actually work on chain? | Deposit + mint txs committed; `ickb_verify.js` — 17/17 |

Module index: [ickb/readme.md](./ickb/readme.md).

### xUDT

| # | Sub-module | Question it answers | Main evidence |
|---|---|---|---|
| 01 | [Introduction](./xudt/01_introduction/readme.md) | What does xUDT add to sUDT? | Live decode of a 21,000,000-unit legacy xUDT cell and the new 113-byte extension args |
| 02 | [How xUDT works](./xudt/02_how-xudt-works/readme.md) | How are owner mode, supply conservation, and extensions evaluated? | Offline decision matrix and the exact validation order from `xudt_rce.c` |
| 03 | [Programmability](./xudt/03_programmability/readme.md) | Can a custom extension actually run on CKB? | Deployed C extension, live mint, live transfer, live cap rejection `-104` |
| 04 | [xUDT RFC](./xudt/04_xudt-rfc/readme.md) | Which RFC clauses are proven, and which are not? | `rfc_conformance_check.js`: 8 PASS, 5 DEFERRED, 0 FAIL |

Module index: [xudt/readme.md](./xudt/readme.md).

---

## Live Testnet Artifacts

Network: **Pudge testnet** (`https://testnet.ckb.dev/rpc`)  
Explorer: `https://pudge.explorer.nervos.org`

### iCKB

| Artifact | Value |
|---|---|
| Phase 1 deposit tx | [`0x631c8b4ae65aa456006472e526b89c0047869e8e40fdbfa331d8621dd6d05371`](https://pudge.explorer.nervos.org/transaction/0x631c8b4ae65aa456006472e526b89c0047869e8e40fdbfa331d8621dd6d05371) |
| Phase 1 block | `22804094` |
| Phase 1 proof | `1,082 CKB` DAO deposit cell + `208 CKB` receipt (`quantity=1`, `deposit=1,000 CKB`) |
| Phase 2 mint tx | [`0x4dd5c139ade7638a6bac605e64b652a512fc8b9188c9fa3d5e5d9762d41aa08e`](https://pudge.explorer.nervos.org/transaction/0x4dd5c139ade7638a6bac605e64b652a512fc8b9188c9fa3d5e5d9762d41aa08e) |
| Phase 2 block | `22804097` |
| Phase 2 proof | receipt consumed, `837.7595312 iCKB` minted at header AR `11,936,599,498,468,556` |
| SDK vendored at | `9582ab4` (`ickb/lib/ickb-sdk/` + `PROVENANCE.md`) |
| Verifier | `ickb_verify.js` — 17/17 checks pass |

### xUDT

| Artifact | Value |
|---|---|
| Final extension binary | `transfer_cap.so`, 3,568 bytes |
| Extension SHA-256 | `aa529c9ee859abfd8250d4466620fffc2200e29d276d7656159cebece0a2f599` |
| Extension code hash (`data1`) | `0x850564e93170669357324244c8381a6bef09be3e86b854609bc4a1a8baa08dbd` |
| Extension deploy tx | [`0x2d3acfa6a97ffc84221fb43ec8f48b841f08dd6d5503800d0f091a76cc6517d8`](https://pudge.explorer.nervos.org/transaction/0x2d3acfa6a97ffc84221fb43ec8f48b841f08dd6d5503800d0f091a76cc6517d8) |
| Extension deploy block | `22804184` |
| Extension cell capacity | `3,629 CKB` (3,568-byte binary + cell overhead) |
| Build reproducibility | rebuilt `transfer_cap.so` is byte-identical to the live code cell |
| Token type hash | `0x82850594aee0634a38f38793f5c0c2d9552b91adb7f6b8fded6fe7c3c1cfc978` |
| Mint tx | [`0xfa37c1187695ba0fe55a5e3d0078662ba2c4f5256a3fff8785da758842554573`](https://pudge.explorer.nervos.org/transaction/0xfa37c1187695ba0fe55a5e3d0078662ba2c4f5256a3fff8785da758842554573) |
| Mint block | `22804188` |
| Allowed transfer tx | [`0xfff23bd1deba7eb5565117f7da40ac643b47f8d6e331a661a2ffe67b2ed73742`](https://pudge.explorer.nervos.org/transaction/0xfff23bd1deba7eb5565117f7da40ac643b47f8d6e331a661a2ffe67b2ed73742) |
| Allowed transfer block | `22804194` |
| Over-cap rejection | `ValidationFailure: error code -104`, source `Inputs[0].Type`, not committed |

Five extension code cells were deployed while the loader behaviour was pinned down; every one of them is a committed testnet cell, and the first four failed at the first issuance attempt. The full timeline is in module 03:

| # | Build | Deploy block | Code hash | First issuance |
|---|---|---|---|---|
| 1 | static `ET_EXEC` | 22803975 | `0xd3556ab3...` | `-22` (`ERROR_INVALID_ELF`) |
| 2 | `ET_DYN`, default LLD layout | 22804073 | `0x18634703...` | `VM Internal Error: SourceEntry parse_from_u64 4128656` |
| 3 | `ET_DYN`, `-z norelro` | 22804119 | `0xd6258a66...` | `InvalidInstruction { pc: 217658, instruction: 0 }` |
| 4 | probe, `--no-rosegment` | 22804173 | `0x8e300163...` | Success (probe token) |
| 5 | `transfer_cap.so` | 22804184 | `0x850564e9...` | Success (final token) |

---

## Verification Matrix

### iCKB

| Sub-module | Core primitive | Executed check | Result |
|---|---|---|---|
| 01 Whitepaper | Two-phase mint lifecycle | `ckbValue x 10^16 / AR`, 180-epoch maturity, 2% fee | PASS (offline model) |
| 02 Repositories | Pinned heads, script hashes | 3 repos, 5 hashes vs `constants.ts` | PASS (6/6) |
| 03 Audit | Findings reconciliation | ScaleBit 2024 + 2026 review, LO-01 reproduce condition | PASS (8/8) |
| 04 SDK | Deployed identity | Code hashes MATCH, dep group, pool, ratio | PASS (8/8, live read) |
| 05 Deep dive | Two-phase spend | Deposit + receipt + mint recomputed on chain | PASS (17/17, live) |

### xUDT

| Sub-module | Core primitive | Executed check | Result |
|---|---|---|---|
| 01 Introduction | `amount: uint128 LE` + xUDT args | Decoded a live 21M-unit legacy xUDT cell; parsed the new 113-byte args | PASS |
| 02 How xUDT works | Owner mode / supply / extension pipeline | Reproduced the decision table for mint, 500, 1,000, 1,200, and split 400+900 | PASS (offline model) |
| 03 Programmability | C extension + `ckb_dlopen2` | Deployed and executed a custom cap extension | PASS (live) |
| 03 Programmability | Cap enforcement | 500 accepted; 1,200 rejected with `-104` | PASS (live) |
| 04 RFC | Data/args/flags/ScriptVec/code hash | `rfc_conformance_check.js` | 8 PASS, 5 DEFERRED, 0 FAIL |

The two "offline model" rows (iCKB 01, xUDT 02) mirror the on-chain rule but do not execute CKB-VM; the live proof for both is in the respective sub-module 05 / 03.

---

## Evidence Boundaries

### iCKB

| Capability | Evidence in this report | Status |
|---|---|---|
| Whitepaper lifecycle math | Offline model, 6/6, including 180-epoch maturity and the 2% oversize fee | Proven |
| Repository state | Heads pinned: whitepaper `3e0ffbd`, contracts `c951927`, stack `9582ab4` | Proven |
| Audit | ScaleBit 2024 PDF + 2026 markdown vendored with SHA-256; LO-01 still live | Proven |
| Deployed identity | xUDT `0x50bd…` and Logic `0x2a81…` MATCH live cell data; 8-member dep group | Proven |
| SDK read | Testnet pool `380` deposits (`10` ready), `19` orders, ratio `1.1944796` | Proven |
| Direct deposit + mint | Two committed txs, 17/17 verifier checks | Proven |
| Withdrawal after 180 epochs | Documented in 01, not spent (locks funds ~30 days) | Deferred |
| Order book / instant exit | Read only in 04, not traded | Deferred |
| Mainnet | Not exercised | Deferred |

### xUDT

| Capability | Evidence in this report | Status |
|---|---|---|
| xUDT data layout | Live cells decoded from Pudge | Proven |
| 32-byte owner + flags + `ScriptVec` args | Live 113-byte args decoded and re-hashed | Proven |
| Custom extension deployment | Code cell `0x8505...` committed at block `22804184` | Proven |
| Extension invocation | Mint and transfer accepted only after `validate()` ran | Proven |
| Owner mode | Mint transaction has an owner-lock input; `is_owner_mode=1` | Proven |
| Non-owner supply conservation | Input 1,500 = outputs 1,200 + 300 before cap check | Proven by construction and rejection |
| Transfer cap | 500 accepted, 1,200 rejected with `-104` | Proven |
| P2SH mode (`flags=2`) | Not implemented or exercised | Deferred |
| Multiple extensions / `XudtData` | One extension, no extra data | Deferred |
| `owner_script` + `owner_signature` | Not exercised | Deferred |
| Owner-mode bits `0x20000000/0x40000000/0x80000000` | Not exercised | Deferred |
| Mainnet | Not attempted | Deferred |

No local `ckb-debugger` or Docker was available. Every execution claim above comes from a real testnet transaction or a read-only RPC query.

---

## Project Structure

```text
week8_report_builderTrack/
├── package.json
├── readme.md                             # this master report
├── ickb/
│   ├── package.json
│   ├── readme.md                         # iCKB module report
│   ├── lib/ickb-sdk/                     # vendored stack/sdk @ 9582ab4 + LICENSE + PROVENANCE
│   ├── 01_whitepaper/
│   │   ├── readme.md
│   │   ├── scripts/ickb_whitepaper_demo.js
│   │   └── images/                       # screenshot slots
│   ├── 02_github-repository/
│   │   ├── readme.md
│   │   ├── scripts/ickb_repo_demo.js
│   │   └── images/
│   ├── 03_audit-report/
│   │   ├── readme.md
│   │   ├── scripts/ickb_audit_demo.js
│   │   ├── evidence/                     # ScaleBit 2024 PDF + 2026 markdown, vendored
│   │   └── images/
│   ├── 04_ickb-sdk/
│   │   ├── readme.md
│   │   ├── scripts/ickb_sdk_demo.mjs
│   │   └── images/
│   └── 05_deep-dive/
│       ├── readme.md
│       ├── scripts/ickb_live_deposit.mjs # phase 1 + phase 2 spend
│       ├── scripts/ickb_verify.js        # 17-check verifier
│       ├── deposit.json                  # live deposit state
│       └── images/
└── xudt/
    ├── readme.md                         # xUDT module report
    ├── scripts/common.mjs                # shared CCC + RPC + encoding helpers
    ├── 01_introduction/
    │   ├── readme.md
    │   ├── scripts/xudt_layout_demo.js
    │   └── images/
    ├── 02_how-xudt-works/
    │   ├── readme.md
    │   ├── scripts/xudt_validation_trace.js
    │   └── images/
    ├── 03_programmability/
    │   ├── readme.md
    │   ├── vendor/ckb-c-stdlib/          # vendored headers + license
    │   └── scripts/
    │       ├── transfer_cap.c            # extension source
    │       ├── build.sh                  # RISC-V build
    │       ├── deploy_extension.mjs      # deploy code cell
    │       ├── issue_xudt.mjs            # owner mint
    │       ├── transfer_xudt.mjs         # transfer / --expect-reject
    │       ├── probe.c                   # loader probe (no syscalls)
    │       ├── deployment.testnet.json
    │       └── transfer_cap.so           # deployed artifact
    └── 04_xudt-rfc/
        ├── readme.md
        └── scripts/
            ├── rfc_conformance_check.js
            ├── rejection-evidence.txt
            └── rfc_conformance_result.json
```

---

## Reproduction

```bash
cd week8_report_builderTrack

# ===== iCKB =====
cd ickb && npm install

# Offline / repository / audit
npm run 01
npm run 02
npm run 03

# Live read-only (deployment, pool, ratio)
npm run 04

# Live deposit pair — build first, then spend, then verify
node 05_deep-dive/scripts/ickb_live_deposit.mjs --dry-run
# node 05_deep-dive/scripts/ickb_live_deposit.mjs   # spends real testnet CKB
npm run verify

# ===== xUDT =====
cd .. && npm install

# 01: read live cells and decode xUDT layout
node xudt/01_introduction/scripts/xudt_layout_demo.js

# 02: reproduce the offline decision matrix
node xudt/02_how-xudt-works/scripts/xudt_validation_trace.js

# 03: rebuild on a RISC-V toolchain, then inspect the ELF
cd xudt/03_programmability/scripts
./build.sh
readelf -lW transfer_cap.so

# 03: deploy + mint + transfer (spends real testnet CKB)
# EXTENSION_BINARY=transfer_cap.so FORCE=1 node deploy_extension.mjs
# node issue_xudt.mjs
# node transfer_xudt.mjs --amount 500

# 03: over-cap rejection (expected to fail with -104)
node transfer_xudt.mjs --amount 1200 --expect-reject

# 04: verify live artifacts against the RFC
cd ../..
node xudt/04_xudt-rfc/scripts/rfc_conformance_check.js
```

The live-spending commands are commented out because they consume testnet capacity. `deployment.testnet.json` records the xUDT artifacts already produced, and `ickb/05_deep-dive/deposit.json` records the iCKB deposit pair. `01`–`04` of every module are safe to re-run at any time.

---

## Screenshot Slots

The readmes reference `images/foto-N.png` slots. Capture them from a real terminal/browser session; no image is claimed before the file exists.

### iCKB

| Slot | Suggested capture |
|---|---|
| `ickb/01_whitepaper/images/foto-1.png` | `npm run 01` — lifecycle math, 6/6 checks |
| `ickb/02_github-repository/images/foto-2.png` | `npm run 02` — pinned repos and script-hash matches |
| `ickb/03_audit-report/images/foto-3.png` | `npm run 03` — audit findings and LO-01 status |
| `ickb/04_ickb-sdk/images/foto-4.png` | `npm run 04` — live pool, ratio, code-hash MATCH |
| `ickb/05_deep-dive/images/foto-1.png` | `npm run verify` — deposit + mint pair, 17/17 |

### xUDT

| Slot | Suggested capture |
|---|---|
| `xudt/01_introduction/images/foto-1.png` | Terminal output of `xudt_layout_demo.js`, especially the amount/args decode |
| `xudt/02_how-xudt-works/images/foto-2.png` | Terminal output of `xudt_validation_trace.js`, especially the 5-row matrix |
| `xudt/03_programmability/images/foto-3.png` | `./build.sh` output plus `readelf -lW transfer_cap.so` showing the RX LOAD at offset 0 |
| `xudt/03_programmability/images/foto-4.png` | Deploy output with code hash and tx `0x2d3a...` |
| `xudt/03_programmability/images/foto-5.png` | Mint output with token cell and tx `0xfa37...` |
| `xudt/03_programmability/images/foto-6.png` | Allowed transfer output, 500 / 1,500, tx `0xfff2...` |
| `xudt/03_programmability/images/foto-7.png` | Over-cap rejection showing `-104` |
| `xudt/04_xudt-rfc/images/foto-8.png` | `rfc_conformance_check.js` summary and JSON |

---

## Next

Both blocks are functionally complete on testnet. Remaining work is evidence packaging: capture the thirteen screenshots, then submit.

Follow-on work, by module:

- **iCKB**: the honest gap is the exit — iCKB → receipt → DAO withdrawal request → 180 epochs → CKB. The timing and claim-epoch math are proven in `01`; executing it would lock funds for ~30 days, so it is documented, not spent. The order-book path and instant exit are read only.
- **xUDT**: the deferred RFC surfaces — `flags=2` P2SH extensions, multiple extensions with `XudtData`, the owner-signature path, and mainnet.
