import { ccc } from "@ckb-ccc/core";

// ============================================================================
// 03 - DAO.C + WITHDRAW PHASE 1: deposit cell -> withdrawing cell
// RFC 0023 phase 1 + ckb-system-scripts/c/dao.c validate_withdrawing_cell
// Deposit tx from step 02 is transformed here (same capacity, data=block LE)
// ============================================================================

const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574";
const RPC_URL = "https://testnet.ckb.dev/rpc";
const DEPOSIT_TX_HASH =
  process.env.DEPOSIT_TX_HASH ||
  "0x9f8978a24370f30254ad1c64ffcd86c9265e9994976430ef43fa7e7cf2fe7ae4";
const DEPOSIT_INDEX = process.env.DEPOSIT_INDEX || "0x0";

async function getTx(txHash) {
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
  console.log("🟢 WEEK6-03: DAO.C + WITHDRAW PHASE 1 - DEPOSIT -> WITHDRAWING");
  console.log("=================================================================\n");

  const client = new ccc.ClientPublicTestnet({ url: RPC_URL });
  const signer = new ccc.SignerCkbPrivateKey(client, PRIVATE_KEY);
  const address = await signer.getRecommendedAddress();
  console.log(`👤 Signer: ${address}`);
  console.log(`💰 Balance: ${ccc.fixedPointToString(await signer.getBalance())} CKB`);
  console.log(`📥 Deposit cell: ${DEPOSIT_TX_HASH}:${DEPOSIT_INDEX}`);

  const depInfo = await getTx(DEPOSIT_TX_HASH);
  if (!depInfo?.transaction) throw new Error("deposit tx not found");
  const depHeaderHash = depInfo.tx_status.block_hash;
  const depBlockNumDec = BigInt(depInfo.tx_status.block_number).toString();
  console.log(`📦 Deposit included in block #${depBlockNumDec} hash=${depHeaderHash}`);

  const depHeader = await client.getHeaderByHash(depHeaderHash);
  console.log(`   Epoch @ deposit: ${depHeader.epoch.integer} + ${depHeader.epoch.numerator}/${depHeader.epoch.denominator}`);
  console.log(`   AR @ deposit   : ${depHeader.dao.ar.toString()}`);

  // dao.c checks replicated off-chain before broadcast:
  // 1. output type hash == input type hash (DAO)
  // 2. output capacity == input capacity
  // 3. output data == deposit block number u64 LE
  const outIdx = Number(DEPOSIT_INDEX);
  const daoCellOutput = depInfo.transaction.outputs[outIdx];
  const daoCellData = depInfo.transaction.outputs_data[outIdx];
  console.log(`\n🔍 dao.c pre-checks (validate_withdrawing_cell):`);
  console.log(`   input capacity : ${daoCellOutput.capacity} (${ccc.fixedPointToString(BigInt(daoCellOutput.capacity))} CKB)`);
  console.log(`   input data     : ${daoCellData} (must be 0x0000000000000000)`);
  console.log(`   type           : ${daoCellOutput.type.code_hash.slice(0, 18)}... (DAO)`);
  if (daoCellData !== "0x0000000000000000") {
    throw new Error("Not a deposit cell (data != 8 zero bytes). Already withdrawn?");
  }

  const depositBlockNum = BigInt(depBlockNumDec);
  const withdrawingData = ccc.numLeToBytes(depositBlockNum, 8);
  // bytesTo hex for log
  console.log(`   withdrawing data (block LE): ${ccc.hexFrom(withdrawingData)} (= #${depBlockNumDec})`);

  // Build phase-1 tx exactly like ccc demo + nervdao
  const daoOutPoint = {
    txHash: DEPOSIT_TX_HASH,
    index: DEPOSIT_INDEX,
  };
  // Need CellOutput object: reconstruct from RPC
  const cellOutput = {
    capacity: BigInt(daoCellOutput.capacity),
    lock: {
      codeHash: daoCellOutput.lock.code_hash,
      hashType: daoCellOutput.lock.hash_type,
      args: daoCellOutput.lock.args,
    },
    type: daoCellOutput.type
      ? {
          codeHash: daoCellOutput.type.code_hash,
          hashType: daoCellOutput.type.hash_type,
          args: daoCellOutput.type.args,
        }
      : undefined,
  };

  const tx = ccc.Transaction.from({
    headerDeps: [depHeaderHash],
    inputs: [{ previousOutput: daoOutPoint }],
    outputs: [cellOutput],
    outputsData: [withdrawingData],
  });
  await tx.addCellDepsOfKnownScripts(client, ccc.KnownScript.NervosDao);

  console.log(`\n⏳ headerDeps[0] = deposit block (dao.c uses it as start of deposit)`);
  console.log(`🔄 completeInputsByCapacity (fee cell) + completeFeeBy...`);
  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1500);

  console.log(`✍️ Broadcasting phase-1...`);
  const txHash = await signer.sendTransaction(tx);
  console.log(`\n🎉 PHASE-1 BROADCAST SUCCESSFUL!`);
  console.log(`🔗 Tx Hash: ${txHash}`);
  console.log(`🌐 Explorer: https://pudge.explorer.nervos.org/transaction/${txHash}`);

  console.log(`\n⏳ Waiting for commit...`);
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const info = await getTx(txHash);
    if (info?.tx_status?.status === "committed") {
      const bn = BigInt(info.tx_status.block_number).toString();
      console.log(`\n✅ Committed in block #${bn}`);
      console.log(`   Block hash: ${info.tx_status.block_hash}`);
      const wHeader = await client.getHeaderByHash(info.tx_status.block_hash);
      console.log(`   Epoch @ withdraw-request: ${wHeader.epoch.integer} + ${wHeader.epoch.numerator}/${wHeader.epoch.denominator}`);
      console.log(`   AR @ withdraw-request  : ${wHeader.dao.ar.toString()}`);
      // dao.c interest preview (no profit yet claimable, must wait 180 epochs)
      const occupied = ccc.fixedPointFrom(102);
      const counted = BigInt(daoCellOutput.capacity) - occupied;
      const profit = ccc.calcDaoProfit(counted, depHeader, wHeader);
      console.log(`\n📊 dao.c calculate_dao_input_capacity preview:`);
      console.log(`   counted (c_t - c_o): ${ccc.fixedPointToString(counted)} CKB`);
      console.log(`   accrued so far     : ${ccc.fixedPointToString(profit)} CKB (not yet claimable)`);
      console.log(`   claim epoch        : ${JSON.stringify(ccc.calcDaoClaimEpoch(depHeader, wHeader), (k, v) => typeof v === "bigint" ? v.toString() : v)}`);
      console.log(`   ⚠️ Phase-2 requires since >= claim epoch (~180 epochs after deposit).`);
      console.log(`\n📌 SAVE FOR REPORT:`);
      console.log(`   phase1_tx_hash=${txHash}`);
      console.log(`   withdrawing_block=${bn}`);
      break;
    }
    process.stdout.write(".");
  }
  console.log(`\n🏁 Week6-03 Phase-1 Complete!\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Execution Error:", err);
  process.exit(1);
});
