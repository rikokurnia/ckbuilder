import { ccc } from "@ckb-ccc/core";

// ============================================================================
// 05 - RGB++ COIN (CKB-side half): xUDT issuance on Pudge
// ============================================================================
// Full RGB++ issuance also spends a BTC seal + SPV witness (user-side:
// funded BTC-testnet key + registered btc-assets-api token). This script
// executes the CKB asset-state half with identical xUDT semantics:
// first-issuance (owner mode) of a new xUDT type bound to our lock hash.
// ============================================================================

const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574";
const RPC_URL = "https://testnet.ckb.dev/rpc";
const ISSUE_AMOUNT = 21_000_000n; // 21M units, Bitcoin-supply nod

function u128LE(n) {
  const buf = Buffer.alloc(16);
  buf.writeBigUInt64LE(n & 0xffffffffffffffffn, 0);
  buf.writeBigUInt64LE((n >> 64n) & 0xffffffffffffffffn, 8);
  return "0x" + buf.toString("hex");
}

async function txStatus(txHash) {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: 1, jsonrpc: "2.0", method: "get_transaction", params: [txHash] }),
  });
  return (await res.json())?.result?.tx_status || null;
}

async function main() {
  console.log("===============================================================");
  console.log("05 - RGB++ COIN ANALOGUE: xUDT ISSUANCE ON PUDGE (LIVE)");
  console.log("===============================================================\n");

  const client = new ccc.ClientPublicTestnet({ url: RPC_URL });
  const signer = new ccc.SignerCkbPrivateKey(client, PRIVATE_KEY);
  const senderAddress = await signer.getRecommendedAddress();
  console.log(`Signer: ${senderAddress}`);
  console.log(`Balance: ${ccc.fixedPointToString(await signer.getBalance())} CKB`);

  const { script: ownerLock } = await ccc.Address.fromString(senderAddress, client);
  const ownerLockHash = await ownerLock.hash();
  console.log(`\nOwner lock hash (xUDT type args): ${ownerLockHash}`);

  const known = await client.getKnownScript(ccc.KnownScript.XUdt);
  console.log(`xUDT codeHash: ${known.codeHash}`);
  const xudtType = { codeHash: known.codeHash, hashType: known.hashType, args: ownerLockHash };
  const dataHex = u128LE(ISSUE_AMOUNT);
  console.log(`Issuing: ${ISSUE_AMOUNT.toLocaleString()} units, data=${dataHex.slice(0, 20)}... (u128 LE)`);

  const tx = ccc.Transaction.from({
    outputs: [{ lock: ownerLock, type: xudtType, capacity: ccc.fixedPointFrom(200) }],
    outputsData: [dataHex],
    cellDeps: known.cellDeps.map((c) => c.cellDep),
  });

  console.log("\nBalancing + fee...");
  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1500n);
  console.log("Broadcasting to Pudge...");
  const txHash = await signer.sendTransaction(tx);
  console.log(`\nTransaction Hash: ${txHash}`);
  console.log(`Explorer: https://pudge.explorer.nervos.org/transaction/${txHash}`);

  console.log("\nWaiting for confirmation...");
  let st = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    process.stdout.write(".");
    st = await txStatus(txHash);
    if (st?.status === "committed") break;
  }
  if (st?.status === "committed") {
    console.log(`\nCommitted in block ${parseInt(st.block_number, 16)} (${st.block_number})`);
  } else console.log("\nTimeout (verify via explorer/RPC).");

  console.log("\nDone.");
  console.log(JSON.stringify({ txHash, xudtArgs: ownerLockHash, amount: ISSUE_AMOUNT.toString(), blockNumber: st ? parseInt(st.block_number, 16).toString() : null }, null, 2));
}

main().catch((e) => { console.error("\nExecution error:", e); process.exit(1); });
