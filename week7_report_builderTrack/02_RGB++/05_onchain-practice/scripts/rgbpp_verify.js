/**
 * 05 - RGB++ Deployment + Lifecycle Verify (READ-ONLY, no spend)
 * - Pudge: RGB++ lock + BTC_TIME_lock Meepo-testnet deployment cells (code_hash match vs docs)
 * - Pudge: xUDT coin tx commitment
 * - BTC testnet liveness via mempool.space (free, no key); btc-assets-api gated (documented)
 */
const { ccc } = require("@ckb-ccc/core");

const RPC_URL = "https://testnet.ckb.dev/rpc";
const EXPECT = {
  rgbppLock: { codeHash: "0x61ca7a4796a4eb19ca4f0d065cb9b10ddcf002f10f7cbb810c706cb6bb5c3248", txHash: "0xf1de59e973b85791ec32debbba08dff80c63197e895eb95d67fc1e9f6b413e00" },
  btcTimeLock: { codeHash: "0x00cdf8fab0f8ac638758ebf5ea5e4052b1d71e8a77b9f43139718621f6849326", txHash: "0xde0f87878a97500f549418e5d46d2f7704c565a262aa17036c9c1c13ad638529" },
};
const COIN_TX = "0x36bc583f34bc903d2e736a7a7f856606373185f5d3e48bec894eb2ac875a4997";

async function rpc(method, params) {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: 1, jsonrpc: "2.0", method, params }),
  });
  return (await res.json()).result;
}

async function checkDeployment(label, { codeHash, txHash }) {
  const tx = await rpc("get_transaction", [txHash]);
  const st = tx?.tx_status;
  const committed = st?.status === "committed";
  // The deployed script cell is outputs[0]; its TYPE script hashes to the documented codeHash.
  const cellType = tx?.transaction?.outputs?.[0]?.type;
  let match = false;
  if (cellType) {
    const s = ccc.Script.from({ codeHash: cellType.code_hash, hashType: cellType.hash_type, args: cellType.args });
    match = (await s.hash()).toLowerCase() === codeHash.toLowerCase();
  }
  console.log(`[${label}]`);
  console.log(`  deployTx : ${txHash}`);
  console.log(`  status   : ${st?.status || "?"}${committed ? " (VERIFIED)" : ""} block #${st?.block_number ? parseInt(st.block_number, 16) : "?"}`);
  console.log(`  codeHash : ${codeHash.slice(0, 18)}... on-chain type-hash match=${match}`);
  console.log(`  explorer : https://pudge.explorer.nervos.org/transaction/${txHash}`);
  return committed && match;
}

async function main() {
  console.log("===============================================================");
  console.log("05 - RGB++ DEPLOYMENT + LIFECYCLE VERIFY (READ-ONLY)");
  console.log("===============================================================\n");

  const r1 = await checkDeployment("rgbppLock@meepo-testnet", EXPECT.rgbppLock);
  console.log("");
  const r2 = await checkDeployment("btcTimeLock@meepo-testnet", EXPECT.btcTimeLock);

  console.log("\n[coin:xUDT-on-Pudge]");
  const coin = await rpc("get_transaction", [COIN_TX]);
  const cst = coin?.tx_status;
  console.log(`  tx     : ${COIN_TX}`);
  console.log(`  status : ${cst?.status || "?"}${cst?.status === "committed" ? " (VERIFIED)" : ""} block #${cst?.block_number ? parseInt(cst.block_number, 16) : "?"}`);
  console.log(`  explorer: https://pudge.explorer.nervos.org/transaction/${COIN_TX}`);

  console.log("\n[btc-testnet liveness: mempool.space, free, no key]");
  try {
    const tip = await (await fetch("https://mempool.space/testnet/api/blocks/tip/height")).text();
    const fees = await (await fetch("https://mempool.space/testnet/api/v1/fees/recommended")).json();
    console.log(`  tip height: ${tip.trim()}, fastestFee: ${fees.fastestFee} sat/vB`);
  } catch (e) { console.log(`  mempool unreachable: ${e.message}`); }
  console.log("  btc-assets-api testnet: GATED (ASSETS_API_INVALID_PARAM without registered app/domain) — boundary, see readme.");

  console.log(`\n05 Verify Complete (deployments ${r1 && r2 ? "MATCH" : "MISMATCH"}, coin ${cst?.status}).`);
  if (!(r1 && r2)) process.exitCode = 1;
}

main().catch((e) => { console.error("Execution error:", e); process.exit(1); });
