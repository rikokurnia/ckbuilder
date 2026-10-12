# 🏭 06 - Pausable UDT: Production Contract Live on Pudge

> **First fully SSRI-compliant production contract — inventory + live method calls + pause-chain proof**
> Repo: [Alive24/pausable-udt](https://github.com/Alive24/pausable-udt) · Registry defaults: `ckb_ssri_cli/src/libs/default.ts`

---

## 🌟 Executive Summary

Pausable UDT implements the SDK's `UDT` + `UDTPausable` traits: transfers/mints abort with `AbortedFromPause` when a paused lock hash participates; the pause list lives in code by default or in an **external `UDTPausableData` cell chain** (TypeID-chained via `next_type_script`). We verified the production deployment on Pudge: cell inventory, code-cell location, four SSRI calls, and the external pause-data cell — all live.

## 🔗 Live Verification (Pudge testnet)

| Check | Result |
| :--- | :--- |
| PUDT cells (`0x3f6b5156...`, exact type match) | **6 cells**, combined `10020000000000` base units (e.g. `0x00e40b5402000000...` = 100 PUDT ×10⁸) |
| Code cell (TypeID `0x8bab3553...`) | `0x4e2e832e0b1e7b5994681b621b00c1e65f577ee4b440ef95fa07db9bb3d50269:0` ✅ |
| `UDT.symbol` → | `0x50554454` = `"PUDT"` ✅ matches CLI registry |
| `UDT.name` → | `0x50554454` = `"PUDT"` ✅ |
| `UDT.decimals` → | `0x06` ⚠️ **differs from CLI default 8 — on-chain wins, flagged** |
| `UDTPausable.enumerate_paused` → | molecule pause-list **+ `cell_deps[0] = 0x27568466...:0`** ✅ external chain proven |
| Pause-data cell `0x27568466...:0` | 🟢 `committed`, TypeID type, pause-list data ✅ |

Executable [`scripts/pausable_udt_live_demo.js`](./scripts/pausable_udt_live_demo.js) runs LIVE against the local ssri-server when up, else prints this verified transcript.

> 📸 **Execution Proof**: save terminal capture as `images/foto-6.png`.

## 🛡️ Evidence Boundaries (honest gates)

| Capability | Evidence |
|---|---|
| Reads / method calls | Live RPC + ssri-server outputs above |
| Mint / transfer tx | **None — deferred**: PUDT owner lock is not the builder key; broadcasting would need owner rights |
| Funding needed from you | **Nothing** — all reads are free RPC; no manual step required |

## 🚀 Reproduction Guide

```bash
cd week7_report_builderTrack
node "01_SSRI/06_pausable-udt/scripts/pausable_udt_live_demo.js"
# for LIVE SSRI calls: start patched ssri-server first (see module 04)
```
