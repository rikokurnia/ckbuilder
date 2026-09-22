import { ccc } from "@ckb-ccc/core";

// ==============================================================================
// CLASS 2: CKB SCRIPT BASICS DEMONSTRATION
// ==============================================================================
// In CKB, a Script is defined by 3 essential fields:
// 1. code_hash: 32-byte cryptographic identifier of the script binary.
// 2. hash_type: Determines how code_hash is matched against cell_deps:
//    - "data" / "data1" / "data2": Matches BLAKE2b hash of cell data.
//    - "type": Matches Type Script hash (enables Type ID upgradable scripts).
// 3. args: Arbitrary bytes passed to the script instance at runtime.
// ==============================================================================

const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574";

const RPC_URL = "https://testnet.ckb.dev/rpc";

async function checkTxStatusViaRpc(txHash) {
  try {
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
    return json?.result?.tx_status;
  } catch (err) {
    return null;
  }
}

async function main() {
  console.log("=================================================================");
  console.log("📘 CLASS 2: CKB SCRIPT BASICS - ON-CHAIN TESTNET VERIFICATION");
  console.log("=================================================================\n");

  const client = new ccc.ClientPublicTestnet({ url: RPC_URL });
  const signer = new ccc.SignerCkbPrivateKey(client, PRIVATE_KEY);

  const senderAddress = await signer.getRecommendedAddress();
  console.log(`👤 Signer Address: ${senderAddress}`);

  const balance = await signer.getBalance();
  console.log(`💰 Current Balance: ${ccc.fixedPointToString(balance)} CKB\n`);

  // 1. Inspect Signer's Default Lock Script Anatomy
  const { script: defaultLock } = await ccc.Address.fromString(senderAddress, client);

  console.log("🔍 Default Lock Script Anatomy:");
  console.log(`   • code_hash: ${defaultLock.codeHash}`);
  console.log(`   • hash_type: ${defaultLock.hashType}`);
  console.log(`   • args     : ${defaultLock.args} (Length: ${defaultLock.args.length / 2 - 1} bytes)`);

  // 2. Create a Script Instance with Custom Parameterized Args
  // We simulate a parameterized time-bound or tag-bound lock script
  // Format: [20-byte public key hash] + [4-byte custom tag/identifier]
  const customTag = "c0c0"; // 2-byte hex tag (Class 2 identifier)
  const parameterizedArgs = `${defaultLock.args}${customTag}`;

  const parameterizedLock = ccc.Script.from({
    codeHash: defaultLock.codeHash,
    hashType: defaultLock.hashType,
    args: parameterizedArgs,
  });

  console.log("\n🧪 Parameterized Script Instance Created:");
  console.log(`   • code_hash: ${parameterizedLock.codeHash}`);
  console.log(`   • hash_type: ${parameterizedLock.hashType}`);
  console.log(`   • args     : ${parameterizedLock.args} (Extended with tag: 0x${customTag})`);

  // 3. Assemble Transaction: Create a live cell governed by the Parameterized Script
  const statePayload = "CKB Script Basics: code_hash, hash_type, args resolution [Class 2]";
  const stateBytes = new TextEncoder().encode(statePayload);
  const stateHex = ccc.hexFrom(stateBytes);

  // Capacity calculation: 61 base + args extra (2 bytes) + stateBytes (68 bytes) = ~131 CKB
  const outputCapacity = ccc.fixedPointFrom("150"); // 150 CKB

  console.log(`\n⏳ Building Transaction:`);
  console.log(`   • Output Capacity: 150.0 CKB`);
  console.log(`   • Output State Data: "${statePayload}"`);

  const tx = ccc.Transaction.from({
    outputs: [
      {
        lock: parameterizedLock,
        capacity: outputCapacity,
      },
    ],
    outputsData: [stateHex],
  });

  console.log("\n🔄 Completing inputs and fee...");
  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1500n);

  console.log("✍️  Signing and broadcasting transaction to CKB Testnet (Pudge)...");
  const txHash = await signer.sendTransaction(tx);

  console.log(`\n🎉 TRANSACTION BROADCAST SUCCESSFUL!`);
  console.log(`🔗 Transaction Hash: ${txHash}`);
  console.log(`🌐 Explorer Link: https://pudge.explorer.nervos.org/transaction/${txHash}`);

  console.log("\n⏳ Waiting for on-chain confirmation...");
  let confirmed = false;
  let attempts = 0;
  while (!confirmed && attempts < 30) {
    attempts++;
    await new Promise((r) => setTimeout(r, 4000));
    const txStatus = await checkTxStatusViaRpc(txHash);
    if (txStatus && txStatus.status === "committed") {
      confirmed = true;
      console.log(`\n✅ Transaction committed on-chain!`);
      console.log(`   • Block Number: ${parseInt(txStatus.block_number, 16)} (${txStatus.block_number})`);
      console.log(`   • Block Hash  : ${txStatus.block_hash}`);
      break;
    }
    process.stdout.write(".");
  }

  console.log("\n🏁 Class 2 Practical Execution Complete!\n");
}

main().catch((err) => {
  console.error("❌ Execution Error:", err);
  process.exit(1);
});
