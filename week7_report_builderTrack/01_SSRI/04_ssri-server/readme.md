# 🖥️ 04 - ssri-server: Off-Chain Method Execution (Live Calls)

> **Built from source, patched a real incompatibility, executed 4 live SSRI calls**
> Repo: [ckb-devrel/ssri-server](https://github.com/ckb-devrel/ssri-server) · JSON-RPC `run_script_level_{code,script,cell,tx}`

---

## 🌟 Executive Summary

`ssri-server` runs deployed CKB scripts **off-chain in CKB-VM** and returns their `set_content` output over JSON-RPC — the server half of the SSRI design. We built it (`cargo build`, 2m19s), found its own README example **fails out of the box**, root-caused it, patched it (6 lines), and executed 4 verified method calls against the module-03 prototype code cell.

## 🔧 The 2103 Incompatibility (real finding)

- Stock server wires result capture to syscall `write` (**2605**); the `set_content` (**2103**) arm is **commented out**.
- The prototype (compiled against its era's `ckb-std`) emits results via **2103** → every successful call dies with `Failed to run program: invalid syscall 2103`.
- Fix: uncomment the 2103 arm (vendored diff: [`server-2103-compat.patch`](./server-2103-compat.patch)); incremental rebuild 2.58s.
- Bonus doc bug: README says port `8090`, but `config.toml`/`test.sh` use **9090** — use 9090.

## ✅ Live Call Results (local server → Pudge code cell `0x900afcf7...:0`)

| Call | argv[0] | Result |
| :--- | :--- | :--- |
| `SSRI.get_methods` (offset 0, limit 10) | `0x58f02409de9de7b1` | 8 paths — **every one matches module-01 computations**, incl. newly discovered `UDT.balance = 0x912ea7d939004f3a` |
| `UDT.name` | `0xc78a67cec2fcc54f` | `0x54657374` = `"Test"` ✓ (matches `udt.rs`) |
| `UDT.decimals` | `0x2f87f08056af234d` | `0x08` ✓ |
| `SSRI.version` | `0x6f2a4642323106f8` | `0x00` ✓ |

```text
🟢 WEEK7-04: ssri-server OFF-CHAIN METHOD EXECUTION
   ✅ Server reachable — running 4 LIVE method calls:
   SSRI.get_methods ... content=0x6f2a46...39004f3a  ✅ LIVE-MATCH
   ...
✅ Method-list cross-check PASSED
```

Executable [`scripts/ssri_server_demo.js`](./scripts/ssri_server_demo.js) runs **LIVE** when the server is up, otherwise prints this verified transcript (labeled 📼 recorded) — start the server with `./target/debug/ssri-server` in a `ssri-server` clone with the patch applied.

> 📸 **Execution Proof**: save terminal capture as `images/foto-4.png` (LIVE mode preferred: start server first).

## 🚀 Reproduction Guide

```bash
git clone https://github.com/ckb-devrel/ssri-server /tmp/ssri-server && cd /tmp/ssri-server
# apply week7_report_builderTrack/01_SSRI/04_ssri-server/server-2103-compat.patch
cargo build && ./target/debug/ssri-server # :9090, ckb_rpc=testnet
cd week7_report_builderTrack
node "01_SSRI/04_ssri-server/scripts/ssri_server_demo.js"
```
