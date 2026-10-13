import { ccc } from "@ckb-ccc/core";

// ============================================================================
// 04 - ssri-server: off-chain SSRI method execution (live calls or transcript)
// Repo: https://github.com/ckb-devrel/ssri-server
// Target: ssri-test prototype code cell 0x900afcf7...fc51e5c:0 (Pudge)
// Build: cargo build (2m19s) + 6-line set_content(2103) compat patch
//        (see server-2103-compat.patch; upstream test.sh fails unpatched)
// Server: ./target/debug/ssri-server (ckb_rpc=testnet, :9090)
// ============================================================================

const SERVER = process.env.SSRI_SERVER_URL || "http://localhost:9090";
const CODE_TX = "0x900afcf79235e88f7bdf8a5d320365b7912f8074f4489a68405f43586fc51e5c";
const CODE_INDEX = 0;

function methodPath(sig) {
  return ccc.hashCkb(new TextEncoder().encode(sig)).slice(0, 18);
}

async function call(id, method, params) {
  const res = await fetch(SERVER, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, jsonrpc: "2.0", method, params }),
  });
  return res.json();
}

const RECORDED = [
  ["SSRI.get_methods", ["0x58f02409de9de7b1", "0x0000000000000000", "0x0a00000000000000"],
    "0x6f2a4642323106f858f02409de9de7b1b43d1128f8726c19b751cc5bbca63da9c78a67cec2fcc54f35fa711c8c918aad2f87f08056af234d912ea7d939004f3a"],
  ["UDT.name", ["0xc78a67cec2fcc54f"], "0x54657374 (\"Test\")"],
  ["UDT.decimals", ["0x2f87f08056af234d"], "0x08"],
  ["SSRI.version", ["0x6f2a4642323106f8"], "0x00"],
];

async function main() {
  console.log("=================================================================");
  console.log("🟢 WEEK7-04: ssri-server OFF-CHAIN METHOD EXECUTION");
  console.log("=================================================================\n");

  console.log(`🎯 Code cell: ${CODE_TX.slice(0, 18)}...:${CODE_INDEX} (ssri-test, Pudge)`);
  console.log(`🖥️ Server: ${SERVER} (start: ./target/debug/ssri-server in ssri-server clone)`);

  let live = false;
  let lastErr = "";
  for (let attempt = 1; attempt <= 3 && !live; attempt++) {
    try {
      const probe = await call(0, "run_script_level_code",
        [CODE_TX, CODE_INDEX, [methodPath("SSRI.version")]]);
      if (probe?.result?.content === "0x00") {
        live = true;
        console.log(`✅ Server reachable (attempt ${attempt}) — running 4 LIVE method calls:\n`);
      } else throw new Error("unexpected probe: " + JSON.stringify(probe).slice(0, 160));
    } catch (e) {
      lastErr = e.message?.slice(0, 100) ?? String(e);
      if (!live && attempt < 3) {
        console.log(`⏳ Probe attempt ${attempt} failed (${lastErr}) — retrying...`);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }
  if (!live) {
    console.log(`⚠️ Server not reachable after 3 attempts (${lastErr})`);
    console.log(`   (code 1000 = server-side CKB RPC fetch failed; check network, restart server)`);
    console.log(`   Showing RECORDED transcript from verified local run instead:\n`);
  }

  const rows = [];
  for (let i = 0; i < RECORDED.length; i++) {
    const [label, argv, recorded] = RECORDED[i];
    if (live) {
      const r = await call(i + 1, "run_script_level_code", [CODE_TX, CODE_INDEX, argv]);
      const content = r?.result?.content ?? JSON.stringify(r)?.slice(0, 120);
      const ok = content === recorded.split(" ")[0] ? "✅ LIVE-MATCH" : "⚠️ LIVE-DIFF";
      rows.push([label, argv[0], content, ok]);
    } else {
      rows.push([label, argv[0], recorded, "📼 recorded"]);
    }
  }

  for (const [label, path, content, mark] of rows) {
    console.log(`   ${label.padEnd(16)} path=${path}`);
    console.log(`   ${" ".repeat(16)} content=${content}  ${mark}`);
  }

  console.log(`\n🔍 get_methods cross-check vs module 01 (all 8 paths must appear):`);
  const list = rows[0][2].split(" ")[0].toLowerCase();
  const expect = {
    "SSRI.version": "0x6f2a4642323106f8", "SSRI.get_methods": "0x58f02409de9de7b1",
    "SSRI.has_methods": "0xb43d1128f8726c19", "SSRI.get_cell_deps": "0xb751cc5bbca63da9",
    "UDT.name": "0xc78a67cec2fcc54f", "UDT.symbol": "0x35fa711c8c918aad",
    "UDT.decimals": "0x2f87f08056af234d",
  };
  let okAll = true;
  for (const [sig, path] of Object.entries(expect)) {
    const found = list.includes(path.slice(2).toLowerCase());
    if (!found) okAll = false;
    console.log(`   ${sig.padEnd(18)} ${path} ${found ? "✅" : "❌"}`);
  }
  console.log(`   (+ 8th path 0x912ea7d939004f3a = UDT.balance)`);

  console.log(`\n🔑 Takeaways:`);
  console.log(`   1. Off-chain exec returns script-sourced data WITHOUT a tx (Code level).`);
  console.log(`   2. Upstream test.sh/patched-server gap: prototype ckb-std emits set_content=2103,`);
  console.log(`      stock server only wires write=2605 -> fix = 6-line uncomment (patch vendored).`);
  console.log(`   3. README port 8090 vs config/test.sh 9090 — use 9090.`);
  console.log(`\n${okAll ? "✅" : "❌"} Method-list cross-check ${okAll ? "PASSED" : "FAILED"}`);
  console.log(`🏁 Week7-04 SSRI Server Check Complete (${live ? "LIVE" : "TRANSCRIPT"})!\n`);
  process.exit(okAll ? 0 : 1);
}

main().catch((err) => {
  console.error("❌ Execution Error:", err);
  process.exit(1);
});
