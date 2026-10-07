import { ccc } from "@ckb-ccc/core";

// ============================================================================
// 02 - RFC 0023 DEPOSIT: create Nervos DAO deposit cell on testnet
// RFC: https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0023-dao-deposit-withdraw/0023-dao-deposit-withdraw.md
// Rules: type=NervosDAO script, data=8x zero bytes, cell_deps includes DAO
// ============================================================================

const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574";
const RPC_URL = "https://testnet.ckb.dev/rpc";
const DEPOSIT_CKB = process.env.DEPOSIT_CKB || "150";

async function checkTxStatus(txHash) {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "get_transaction",
      params: [txHash],
    }),
  });
  const json = await res.json();
  return json?.result;
}

async function main() {
  console.log("=================================================================");
  console.log("🟢 WEEK6-02: RFC 0023 DAO DEPOSIT - ON-CHAIN TESTNET VERIFICATION");
  console.log("=================================================================\n");

  const client = new ccc.ClientPublicTestnet({ url: RPC_URL });
  const signer = new ccc.SignerCkbPrivateKey(client, PRIVATE_KEY);

  const address = await signer.getRecommendedAddress();
  console.log(`👤 Signer Address: ${address}`);
  const balance = await signer.getBalance();
  console.log(`💰 Balance before: ${ccc.fixedPointToString(balance)} CKB\n`);

  const { script: lock } = await signer.getRecommendedAddressObj();
  console.log(`🔒 Lock script:`);
  console.log(`   code_hash: ${lock.codeHash}`);
  console.log(`   hash_type: ${lock.hashType}`);
  console.log(`   args     : ${lock.args}`);

  const daoType = await ccc.Script.fromKnownScript(
    client,
    ccc.KnownScript.NervosDao,
    "0x"
  );
  console.log(`\n🏛️ DAO type script (RFC 0023):`);
  console.log(`   code_hash: ${daoType.codeHash}`);
  console.log(`   hash_type: ${daoType.hashType}`);
  console.log(`   args     : ${daoType.args}`);
  console.log(`   data     : 0x0000000000000000 (8 zero bytes = deposit cell)`);

  const tx = ccc.Transaction.from({
    outputs: [
      {
        lock,
        type: daoType,
      },
    ],
    outputsData: ["00".repeat(8)],
  });
  await tx.addCellDepsOfKnownScripts(client, ccc.KnownScript.NervosDao);

  const depositCapacity = ccc.fixedPointFrom(DEPOSIT_CKB);
  // Minimum occupied for DAO cell is 102 CKB; enforce guard
  const minOccupied = ccc.fixedPointFrom(102);
  if (depositCapacity < minOccupied) {
    throw new Error(`Deposit must be >= 102 CKB, got ${DEPOSIT_CKB}`);
  }
  tx.outputs[0].capacity = depositCapacity;
  console.log(`\n⏳ Constructing deposit tx:`);
  console.log(`   • Output capacity: ${DEPOSIT_CKB} CKB`);
  console.log(`   • outputsData[0]: 0x0000000000000000`);

  console.log(`🔄 Completing inputs by capacity + fee...`);
  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1500);

  console.log(`✍️ Signing + broadcasting to Pudge testnet...`);
  const txHash = await signer.sendTransaction(tx);
  console.log(`\n🎉 DEPOSIT BROADCAST SUCCESSFUL!`);
  console.log(`🔗 Transaction Hash: ${txHash}`);
  console.log(`🌐 Explorer: https://pudge.explorer.nervos.org/transaction/${txHash}`);

  console.log(`\n⏳ Waiting for commit (polling RPC)...`);
  let attempts = 0;
  while (attempts < 30) {
    attempts++;
    await new Promise((r) => setTimeout(r, 4000));
    const info = await checkTxStatus(txHash);
    const status = info?.tx_status?.status;
    if (status === "committed") {
      const blockNum = BigInt(info.tx_status.block_number).toString();
      const blockHash = info.tx_status.block_hash;
      console.log(`\n✅ Committed in block #${BigInt("0x" + BigInt(blockNum).toString(16) ? blockNum : blockNum).toString()} (raw ${info.tx_status.block_number})`);
      console.log(`   Block number (dec): ${BigInt(info.tx_status.block_number).toString()}`);
      console.log(`   Block hash        : ${blockHash}`);
      // Fetch header for AR / epoch proof
      const header = await client.getHeaderByHash(blockHash);
      if (header) {
        console.log(`   Epoch             : integer=${header.epoch.integer} index=${header.epoch.numerator}/${header.epoch.denominator}`);
        console.log(`   DAO AR @ deposit  : ${header.dao.ar.toString()} (${(Number(header.dao.ar) / 1e16).toFixed(12)})`);
        console.log(`\n📌 SAVE FOR PHASE 1:`);
        console.log(`   deposit_tx_hash=${txHash}`);
        console.log(`   deposit_block_hash=${blockHash}`);
        console.log(`   deposit_block_number=${BigInt(header.number).toString()}`);
      }
      break;
    }
    process.stdout.write(".");
  }

  const balanceAfter = await signer.getBalance();
  console.log(`\n💰 Balance after: ${ccc.fixedPointToString(balanceAfter)} CKB`);
  console.log(`\n🏁 Week6-02 Deposit Complete!\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Execution Error:", err);
  process.exit(1);
});
