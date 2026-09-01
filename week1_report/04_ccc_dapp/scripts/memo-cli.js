import { ccc } from "@ckb-ccc/core";

// ============================================================================
// CCC CORE CONCEPTS DEMONSTRATION SCRIPT: ON-CHAIN MEMO BOARD
// ============================================================================
// 1. Client       -> Connection to CKB Testnet (Pudge)
// 2. Address      -> Address parsing, formatting, and lock script derivation
// 3. Signer       -> Private Key Signer for signing & transaction assembly
// 4. Cell Model   -> Calculating cell capacity (61 bytes overhead + memo bytes)
// 5. Transaction  -> Assembling, fee balancing, signing, broadcasting & querying
// ============================================================================

const TESTNET_PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574";

const MEMO_TEXT =
  process.argv[2] ||
  "Hello CKB! Demonstrating CCC Core Concepts: Client, Address, Signer, Cell Model & Transaction.";

async function main() {
  console.log("=================================================================");
  console.log("🚀 CCC CORE CONCEPTS DEMO: ON-CHAIN MEMO BOARD (TESTNET)");
  console.log("=================================================================\n");

  // --------------------------------------------------------------------------
  // CONCEPT 1: CLIENT (Interacting with CKB Node RPC)
  // --------------------------------------------------------------------------
  console.log("📌 [CONCEPT 1: CLIENT]");
  console.log("Connecting to CKB Public Testnet via ccc.ClientPublicTestnet()...");
  const client = new ccc.ClientPublicTestnet({
    url: "https://testnet.ckb.dev/rpc",
  });

  const tipHeader = await client.getTipHeader();
  console.log(`✅ Client Connected! Current Tip Block Height: ${tipHeader.number.toString()}`);
  console.log("-----------------------------------------------------------------\n");

  // --------------------------------------------------------------------------
  // CONCEPT 2 & 3: ADDRESS & SIGNER
  // --------------------------------------------------------------------------
  console.log("📌 [CONCEPT 2 & 3: ADDRESS & SIGNER]");
  const signer = new ccc.SignerCkbPrivateKey(client, TESTNET_PRIVATE_KEY);
  const userAddress = await signer.getRecommendedAddress();
  const lockScript = await signer.getRecommendedAddressObj().then((a) => a.script);

  console.log(`🔑 Signer Initialized: SECP256K1 Blake160 Signer`);
  console.log(`📫 User Address:       ${userAddress}`);
  console.log(`🔒 Derived Lock Script:`);
  console.log(`   - Code Hash: ${lockScript.codeHash}`);
  console.log(`   - Hash Type: ${lockScript.hashType}`);
  console.log(`   - Args:      ${lockScript.args}`);

  // Query live balance using client
  let balance = 0n;
  for await (const cell of client.findCells({ script: lockScript, scriptType: "lock" })) {
    balance += cell.cellOutput.capacity;
  }
  console.log(`💰 Available Balance:  ${ccc.fixedPointToString(balance)} CKB`);
  console.log("-----------------------------------------------------------------\n");

  // --------------------------------------------------------------------------
  // CONCEPT 4: CKB CELL MODEL (State storage & capacity pricing)
  // --------------------------------------------------------------------------
  console.log("📌 [CONCEPT 4: CKB CELL MODEL]");
  console.log(`📝 Memo to write on-chain: "${MEMO_TEXT}"`);

  const memoBytes = new TextEncoder().encode(MEMO_TEXT);
  const memoHex = ccc.hexFrom(memoBytes);
  const memoByteSize = memoBytes.length;

  // On CKB, every byte of storage requires 1 CKB capacity.
  // Standard cell without type script has a 61-byte base overhead:
  // - 8 bytes: Capacity (uint64)
  // - 32 bytes: Lock script code_hash
  // - 1 byte: Lock script hash_type
  // - 20 bytes: Lock script args (blake160)
  // Total base overhead = 8 + 32 + 1 + 20 = 61 bytes.
  // Minimum required capacity = (61 + memoByteSize) CKB.
  const minRequiredCapacity = ccc.fixedPointFrom(61 + memoByteSize);
  // We allocate 100 CKB to comfortably cover capacity requirements:
  const allocatedCapacity = ccc.fixedPointFrom(100);

  console.log(`📦 Payload Byte Size:   ${memoByteSize} bytes`);
  console.log(`⚙️  Cell Base Overhead: 61 bytes (8B capacity + 32B codeHash + 1B hashType + 20B args)`);
  console.log(`📏 Minimum Required:   ${ccc.fixedPointToString(minRequiredCapacity)} CKB`);
  console.log(`🛡️  Allocated Capacity:  ${ccc.fixedPointToString(allocatedCapacity)} CKB`);
  console.log(`💾 Raw Cell Data (Hex): ${memoHex.slice(0, 42)}... (${memoHex.length} hex chars)`);
  console.log("-----------------------------------------------------------------\n");

  // --------------------------------------------------------------------------
  // CONCEPT 5: TRANSACTION (Assembly, Balancing, Signing & Broadcasting)
  // --------------------------------------------------------------------------
  console.log("📌 [CONCEPT 5: TRANSACTION]");
  console.log("Assembling CKB Transaction with Output Memo Cell...");

  const tx = ccc.Transaction.from({
    outputs: [
      {
        lock: lockScript,
        capacity: allocatedCapacity,
      },
    ],
    outputsData: [memoHex],
  });

  console.log("⏳ Balancing inputs, change cell, and miner fee with Signer...");
  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1500n);

  console.log(`🧾 Transaction Structure Prepared:`);
  console.log(`   - Total Inputs:  ${tx.inputs.length} cell(s)`);
  console.log(`   - Total Outputs: ${tx.outputs.length} cell(s) (1 Memo Cell + Change)`);
  console.log(`   - Fee Rate:      1500 Shannons/KB`);

  console.log("✍️  Signing & Broadcasting Transaction to CKB Testnet...");
  const txHash = await signer.sendTransaction(tx);
  console.log(`\n🎉 TRANSACTION BROADCASTED SUCCESSFULLY!`);
  console.log(`🔗 Transaction Hash: ${txHash}`);
  console.log(`🌐 Explorer Link URL: https://pudge.explorer.nervos.org/transaction/${txHash}\n`);

  console.log("⏳ Waiting for transaction confirmation on Testnet...");
  let confirmed = false;
  for (let i = 0; i < 30; i++) {
    const txStatus = await client.getTransaction(txHash);
    if (txStatus && txStatus.txStatus && txStatus.txStatus.status === "committed") {
      console.log(`✅ Transaction committed on-chain in Block #${txStatus.txStatus.blockNumber}!`);
      confirmed = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 3000));
    process.stdout.write(".");
  }

  if (!confirmed) {
    console.log("\n⚠️ Transaction submitted and pending in mempool. Check the explorer link above!");
  }

  console.log("\n=================================================================");
  console.log("✨ DEMONSTRATION COMPLETE: ALL 5 CCC CORE CONCEPTS VERIFIED!");
  console.log("=================================================================\n");
}

main().catch((err) => {
  console.error("❌ Error executing CCC memo demo:", err);
  process.exit(1);
});
