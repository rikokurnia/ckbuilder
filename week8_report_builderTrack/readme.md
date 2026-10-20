# Week 8 Builder Track Master Report: xUDT

**Name Builder**: Riko Kurnia Sandi  
**Date**: 20 October 2026  
**Track**: CKB Builder Track (Phase 3: Advanced - xUDT)

---

## Executive Summary

This report covers the **xUDT** Handbook block end to end: the data model, the validation lifecycle, a working C extension, and a live testnet demonstration of that extension enforcing a transfer cap.

The central result is not a diagram of xUDT. It is a **real extension code cell** loaded by the deployed xUDT script through `ckb_dlopen2`, plus three on-chain outcomes:

1. **Owner mint**: 2,000 units issued to a holder lock.
2. **Allowed transfer**: 500 units moved from the holder to a third party, leaving 1,500 units as change.
3. **Rejected transfer**: a 1,200-unit transfer, above the 1,000-unit cap, was rejected by CKB-VM with **error code `-104`**.

The engineering work also produced two reusable findings about the CKB extension loader:

- A static `ET_EXEC` has no `.dynsym` / `.dynstr`, so `ckb_dlopen2` rejects it with `-22` (`ERROR_INVALID_ELF`). The extension must be a dynamic `ET_DYN` object.
- The executable `PT_LOAD` must start on a page boundary. LLD's default shared-library layout placed `.text` in a separate RX segment at `p_offset=0x23a`, `p_vaddr=0x123a`; the loaded symbol landed in zeroed memory and CKB-VM raised `InvalidInstruction`. Linking with `--no-rosegment` (and `-z norelro`) merged headers, `.dynsym`, `.dynstr`, and `.text` into one RX `PT_LOAD` at offset `0` / vaddr `0`, which the loader handles correctly.

All claims below are testnet-only. The RFC conformance script reports **8 executed checks passing and 5 explicitly deferred**.

---

## Module Reports

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

The earlier **loader probe** (a no-syscall extension) is also live and documented in module 03:

| Probe artifact | Value |
|---|---|
| Probe deploy tx | [`0xc5a3062d0ded3fdb7b0dab66b0efb16045679fc4c99a5eded9ce03a554187619`](https://pudge.explorer.nervos.org/transaction/0xc5a3062d0ded3fdb7b0dab66b0efb16045679fc4c99a5eded9ce03a554187619) |
| Probe block | `22804173` |
| Probe code hash | `0x8e300163646c02e22060d2292cc17161ed74c7f2a5756db56e1d7e79a614e7b7` |

---

## Verification Matrix

| Sub-module | Core primitive | Executed check | Result |
|---|---|---|---|
| 01 Introduction | `amount: uint128 LE` + xUDT args | Decoded a live 21M-unit legacy xUDT cell; parsed the new 113-byte args | PASS |
| 02 How xUDT works | Owner mode / supply / extension pipeline | Reproduced the decision table for mint, 500, 1,000, 1,200, and split 400+900 | PASS (offline model) |
| 03 Programmability | C extension + `ckb_dlopen2` | Deployed and executed a custom cap extension | PASS (live) |
| 03 Programmability | Cap enforcement | 500 accepted; 1,200 rejected with `-104` | PASS (live) |
| 04 RFC | Data/args/flags/ScriptVec/code hash | `rfc_conformance_check.js` | 8 PASS, 5 DEFERRED, 0 FAIL |

`02` is deliberately labelled an **offline model**: it mirrors the C rule but does not execute CKB-VM. The live proof for the same rule is in `03`.

---

## Evidence Boundaries

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
├── readme.md                         # this master report
└── xudt/
    ├── readme.md                     # xUDT module report
    ├── scripts/common.mjs            # shared CCC + RPC + encoding helpers
    ├── 01_introduction/
    │   ├── readme.md
    │   ├── scripts/xudt_layout_demo.js
    │   └── images/                   # screenshot slots
    ├── 02_how-xudt-works/
    │   ├── readme.md
    │   ├── scripts/xudt_validation_trace.js
    │   └── images/
    ├── 03_programmability/
    │   ├── readme.md
    │   ├── vendor/ckb-c-stdlib/      # vendored headers + license
    │   └── scripts/
    │       ├── transfer_cap.c        # extension source
    │       ├── build.sh              # RISC-V build
    │       ├── deploy_extension.mjs  # deploy code cell
    │       ├── issue_xudt.mjs        # owner mint
    │       ├── transfer_xudt.mjs     # transfer / --expect-reject
    │       ├── probe.c               # loader probe (no syscalls)
    │       ├── deployment.testnet.json
    │       └── transfer_cap.so       # deployed artifact
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
npm install

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

The deploy/mint/transfer commands are commented out in the block above because they spend testnet capacity. The existing `deployment.testnet.json` records the artifacts already produced.

---

## Screenshot Slots

The readmes reference `images/foto-N.png` slots. Capture them from a real terminal/browser session; no image is claimed before the file exists.

| Slot | Suggested capture |
|---|---|
| `01_introduction/images/foto-1.png` | Terminal output of `xudt_layout_demo.js`, especially the amount/args decode |
| `02_how-xudt-works/images/foto-2.png` | Terminal output of `xudt_validation_trace.js`, especially the 5-row matrix |
| `03_programmability/images/foto-3.png` | `./build.sh` output plus `readelf -lW transfer_cap.so` showing the RX LOAD at offset 0 |
| `03_programmability/images/foto-4.png` | Deploy output with code hash and tx `0x2d3a...` |
| `03_programmability/images/foto-5.png` | Mint output with token cell and tx `0xfa37...` |
| `03_programmability/images/foto-6.png` | Allowed transfer output, 500 / 1,500, tx `0xfff2...` |
| `03_programmability/images/foto-7.png` | Over-cap rejection showing `-104` |
| `04_xudt-rfc/images/foto-8.png` | `rfc_conformance_check.js` summary and JSON |

---

## Next

The xUDT block is functionally complete on testnet. The remaining work is evidence packaging: capture the eight screenshots, then submit. Follow-on work would be the deferred RFC surfaces: `flags=2` P2SH extensions, multiple extensions with `XudtData`, and the owner-signature path.
