import { readFileSync } from "node:fs";

// ============================================================================
// 03 - ssri-test PROTOTYPE walkthrough + live testnet deployment pointer
// Repo: https://github.com/Hanssen0/ssri-test (first SSRI prototype)
// Vendor: 03_ssri-test-prototype/vendor/ssri-test/ (contracts+tests+migration)
// Deployment: migration 2024-07-20 -> testnet tx 0x900afcf7...fc51e5c:0
// ============================================================================

const RPC_URL = "https://testnet.ckb.dev/rpc";
const VENDOR = new URL("../vendor/ssri-test/", import.meta.url).pathname;
const DEPLOY_TX = "0x900afcf79235e88f7bdf8a5d320365b7912f8074f4489a68405f43586fc51e5c";

async function rpc(method, params) {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: 1, jsonrpc: "2.0", method, params }),
  });
  return (await res.json())?.result;
}

async function main() {
  console.log("=================================================================");
  console.log("🟢 WEEK7-03: ssri-test PROTOTYPE - DISPATCH + LIVE DEPLOYMENT");
  console.log("=================================================================\n");

  const mainRs = readFileSync(VENDOR + "contracts/ssri-test/src/main.rs", "utf8");
  console.log("📜 Dispatch table (contracts/ssri-test/src/main.rs):");
  for (const m of mainRs.matchAll(/"([\w.]+)"\s*=>\s*(.+?),$/gm)) {
    console.log(`   "${m[1]}" => ${m[2].trim().slice(0, 60)}`);
  }
  console.log(`\n   Entry rules visible in code:`);
  console.log(`   - argv empty        -> fallback::fallback() (original verifier path)`);
  console.log(`   - vm_version != MAX -> Error::InvalidVmVersion (off-chain gate)`);
  console.log(`   - ssri_methods! macro maps argv[0] path -> handler, else InvalidMethodPath`);
  console.log(`   - result returned via set_content() (off-chain output channel)`);

  const udtRs = readFileSync(VENDOR + "contracts/ssri-test/src/udt.rs", "utf8");
  console.log(`\n📜 UDT demo handlers (udt.rs): ${udtRs.match(/pub fn \w+/g)?.join(", ")}`);
  console.log(`   name() returns "Test"; decimals() hardcodes 8; balance() hardcodes 1<<64`);

  const mig = JSON.parse(readFileSync(VENDOR + "2024-07-20-091011.json", "utf8"));
  const recipe = mig.cell_recipes[0];
  console.log(`\n📦 Migration receipt (2024-07-20-091011.json):`);
  console.log(`   cell: ${recipe.name}, tx=${recipe.tx_hash}:${recipe.index}`);
  console.log(`   data_hash=${recipe.data_hash}`);
  console.log(`   occupied=${recipe.occupied_capacity} shannon`);

  console.log(`\n🔍 Verifying deployment pointer on Pudge testnet RPC...`);
  const tx = await rpc("get_transaction", [DEPLOY_TX]);
  if (!tx?.transaction) {
    console.log(`   ❌ Deploy tx NOT found on testnet (status=${tx?.tx_status?.status})`);
    console.log(`   (prototype may live on mainnet or another network)`);
  } else {
    const out0 = tx.transaction.outputs[0];
    const data0 = tx.transaction.outputs_data[0];
    console.log(`   ✅ Deploy tx found, status=${tx.tx_status.status}`);
    console.log(`   Block: #${BigInt(tx.tx_status.block_number).toString()} hash=${tx.tx_status.block_hash}`);
    console.log(`   Output[0] capacity=${out0.capacity} data_len=${(data0.length - 2) / 2} bytes`);
    console.log(`   Output[0] lock= ${out0.lock.code_hash.slice(0, 18)}... (owner)`);
    console.log(`   Output[0] type= ${out0.type ? out0.type.code_hash.slice(0, 18) + "..." : "none (code cell)"}`);
    console.log(`\n📌 SSRI code cell for module 04: ${DEPLOY_TX}:0`);
  }

  console.log(`\n🔑 Takeaways:`);
  console.log(`   1. First prototype: ckb-script-templates + ssri_methods! proc-macro dispatch.`);
  console.log(`   2. Same binary serves verifier (no argv) AND query methods (argv[0]).`);
  console.log(`   3. Deployed code cell is the executable artifact ssri-server calls off-chain.`);
  console.log(`\n🏁 Week7-03 Prototype Walkthrough Complete!\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Execution Error:", err);
  process.exit(1);
});
