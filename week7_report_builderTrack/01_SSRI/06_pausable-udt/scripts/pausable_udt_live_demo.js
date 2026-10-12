import { ccc } from "@ckb-ccc/core";

// ============================================================================
// 06 - Pausable UDT LIVE on Pudge: inventory + SSRI calls on PRODUCTION code
// Repo: https://github.com/Alive24/pausable-udt (first production SSRI contract)
// Registry: ckb_ssri_cli defaults (PUDT code_hash 0x3f6b5156...0b48c9)
// Server calls run live if ssri-server is up, else recorded transcript.
// No mint/transfer broadcast: needs owner lock (not our key) -> honest gate.
// ============================================================================

const RPC_URL = "https://testnet.ckb.dev/rpc";
const SERVER = process.env.SSRI_SERVER_URL || "http://localhost:9090";
const PUDT = {
  codeHash: "0x3f6b51561ef57d49ce74d97b5f9013a5c0ef2a80c5f8454b61f748a5000b48c9",
  hashType: "type",
  args: "0xb5202efa0f2d250af66f0f571e4b8be8b272572663707a052907f8760112fe35",
};
const PUDT_TYPE_ID_ARGS = "0x8bab3553b123c83d9bf03c738dfbca828cb20d569ec2cb077a00eef367d98a98";
const TYPE_ID_CODE = "0x00000000000000000000000000000000000000000000000000545950455f4944";
// Pause-data cell discovered via enumerate_paused cell_deps (committed on Pudge)
const PAUSE_DATA_TX = "0x275684669b6054fe6ce015681960c6f82d38c9ebff109f7cd753a14a34ac7ecf";

function u128le(hexData) {
  if (!hexData || hexData.length < 34) return null;
  const b = ccc.bytesFrom(hexData.slice(0, 34), "hex");
  let v = 0n;
  for (let i = 0; i < 16; i++) v |= BigInt(b[i]) << BigInt(8 * i);
  return v;
}

async function ssriCall(id, codeTx, codeIx, argv) {
  const r = await fetch(SERVER, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, jsonrpc: "2.0", method: "run_script_level_code",
      params: [codeTx, codeIx, argv] }),
  });
  return r.json();
}

const RECORDED_CALLS = [
  ["UDT.symbol", ["0x35fa711c8c918aad"], "0x50554454 = \"PUDT\""],
  ["UDT.decimals", ["0x2f87f08056af234d"], "0x06 (note: CLI default says 8 — on-chain wins)"],
  ["UDT.name", ["0xc78a67cec2fcc54f"], "0x50554454 = \"PUDT\""],
  ["UDTPausable.enumerate_paused", ["0x9adf445d336222e1", "0x0000000000000000", "0x0a00000000000000"],
    "molecule pause-list + cell_deps[0]=0x27568466...:0 (external pause-data cell)"],
];

async function main() {
  console.log("=================================================================");
  console.log("🟢 WEEK7-06: PAUSABLE UDT LIVE INVENTORY (Pudge testnet)");
  console.log("=================================================================\n");

  const client = new ccc.ClientPublicTestnet({ url: RPC_URL });

  console.log(`🔍 Scanning PUDT cells (type script exact match)...`);
  let n = 0, total = 0n;
  const samples = [];
  for await (const cell of client.findCells({ script: PUDT, scriptType: "type", scriptSearchMode: "exact" })) {
    n++;
    const amt = u128le(cell.outputData);
    if (amt !== null) total += amt;
    if (samples.length < 3) samples.push({
      tx: cell.outPoint.txHash, ix: cell.outPoint.index.toString(),
      cap: ccc.fixedPointToString(cell.cellOutput.capacity),
      amount: amt === null ? "(no amount data)" : amt.toString(),
    });
    if (n >= 50) break;
  }
  console.log(`   Found ${n} PUDT cell(s); combined amount = ${total} base units`);
  for (const s of samples) {
    console.log(`   - ${s.tx.slice(0, 18)}...:${s.ix} cap=${s.cap} CKB amount=${s.amount}`);
  }

  console.log(`\n🔍 Locating PUDT code cell (TypeID ${PUDT_TYPE_ID_ARGS.slice(0, 18)}...)...`);
  let codeCell = null;
  for await (const cell of client.findCells({
    script: { codeHash: TYPE_ID_CODE, hashType: "type", args: PUDT_TYPE_ID_ARGS },
    scriptType: "type", scriptSearchMode: "exact",
  })) { codeCell = cell; break; }
  if (!codeCell) {
    console.log(`   ⚠️ Code cell not found via TypeID scan.`);
    process.exit(1);
  }
  const codeTx = codeCell.outPoint.txHash, codeIx = Number(codeCell.outPoint.index);
  console.log(`   ✅ Code cell: ${codeTx.slice(0, 18)}...:${codeIx}`);

  console.log(`\n🧪 SSRI calls on production code (live if server up, else recorded):`);
  let live = false;
  try {
    const probe = await ssriCall(0, codeTx, codeIx, [RECORDED_CALLS[0][1][0]]);
    if (probe?.result?.content === "0x50554454") { live = true; console.log(`   ✅ Server live — executing calls:\n`); }
    else throw new Error("probe: " + JSON.stringify(probe).slice(0, 120));
  } catch (e) {
    console.log(`   ⚠️ Server down — recorded transcript:\n`);
  }
  for (let i = 0; i < RECORDED_CALLS.length; i++) {
    const [label, argv, recorded] = RECORDED_CALLS[i];
    let content, mark;
    if (live) {
      const r = await ssriCall(i + 1, codeTx, codeIx, argv);
      content = r?.result
        ? `content=${String(r.result.content).slice(0, 100)}${r.result.cell_deps?.length ? ` + cell_deps[0]=${r.result.cell_deps[0].tx_hash.slice(0, 18)}...` : ""}`
        : JSON.stringify(r).slice(0, 120);
      mark = "✅ LIVE";
    } else { content = recorded; mark = "📼 recorded"; }
    console.log(`   ${label.padEnd(30)} ${content}  ${mark}`);
  }

  console.log(`\n🔍 Pause-data cell pointer check (from enumerate_paused cell_deps):`);
  const res = await fetch(RPC_URL, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: 1, jsonrpc: "2.0", method: "get_transaction", params: [PAUSE_DATA_TX] }) });
  const info = (await res.json())?.result;
  console.log(`   ${PAUSE_DATA_TX.slice(0, 18)}... status=${info?.tx_status?.status} (external UDTPausableData chain head)`);

  console.log(`\n🛡️ Honest gates:`);
  console.log(`   - No mint/transfer tx: PUDT owner lock is not the builder key (would need funding + owner rights).`);
  console.log(`   - decimals()=6 vs CLI default 8: on-chain value wins, flagged for report.`);
  console.log(`   👉 MANUAL (only you): nothing required — no funding needed, all reads are free RPC.`);
  console.log(`\n🏁 Week7-06 Pausable UDT Inventory Complete (${live ? "LIVE" : "TRANSCRIPT"})!\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Execution Error:", err);
  process.exit(1);
});
