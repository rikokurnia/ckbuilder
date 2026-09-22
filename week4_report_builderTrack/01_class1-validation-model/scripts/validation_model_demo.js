import { ccc } from "@ckb-ccc/core";

// ==============================================================================
// CLASS 1: CKB VALIDATION MODEL DEMONSTRATION
// ==============================================================================
// CKB-VM uses a pure validation model:
// 1. Transactions specify inputs (old cells) and outputs (new cells).
// 2. Lock Script validates permissions for spending input cells.
// 3. Type Script validates state transition invariants on input & output cells.
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
  console.log("🟢 CLASS 1: CKB VALIDATION MODEL - ON-CHAIN TESTNET VERIFICATION");
  console.log("=================================================================\n");

  const client = new ccc.ClientPublicTestnet({ url: RPC_URL });
  const signer = new ccc.SignerCkbPrivateKey(client, PRIVATE_KEY);

  const senderAddress = await signer.getRecommendedAddress();
  console.log(`👤 Signer Address: ${senderAddress}`);

  const balance = await signer.getBalance();
  console.log(`💰 Current Balance: ${ccc.fixedPointToString(balance)} CKB\n`);

  // 1. Lock Script Resolution (Owner who has authorization to consume this cell)
  const { script: ownerLock } = await ccc.Address.fromString(senderAddress, client);

  // 2. State Data for Cell Model
  // Demonstrating state storage: 1 byte = 1 CKB capacity requirement
  const statePayload = "CKB Validation Model: Lock=Auth, Type=Invariant, VM=RISC-V [Class 1]";
  const stateBytes = new TextEncoder().encode(statePayload);
  const stateHex = ccc.hexFrom(stateBytes);

  console.log(`📝 State Payload: "${statePayload}"`);
  console.log(`📦 Encoded Data (Hex): ${stateHex} (${stateBytes.length} bytes)`);

  // 3. Assemble Transaction
  // Total cell size = 8 (capacity) + 32 (lock.code_hash) + 1 (lock.hash_type) + lock.args.length + stateBytes.length
  // For standard secp256k1 (args length 20), base overhead is 61 bytes.
  const requiredCapacity = 61n + BigInt(stateBytes.length);
  const cellCapacity = ccc.fixedPointFrom((requiredCapacity + 100n).toString()); // 229 CKB

  console.log(`\n⏳ Constructing Transaction:`);
  console.log(`   • Output Capacity: ${ccc.fixedPointToString(cellCapacity)} CKB`);
  console.log(`   • Output Lock Script (SECP256K1):`);
  console.log(`     - Code Hash: ${ownerLock.codeHash}`);
  console.log(`     - Hash Type: ${ownerLock.hashType}`);
  console.log(`     - Args     : ${ownerLock.args}`);

  const tx = ccc.Transaction.from({
    outputs: [
      {
        lock: ownerLock,
        capacity: cellCapacity,
      },
    ],
    outputsData: [stateHex],
  });

  console.log("\n🔄 Balancing inputs and calculating transaction fee...");
  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1500n);

  console.log("✍️  Signing and broadcasting transaction to CKB Testnet (Pudge)...");
  const txHash = await signer.sendTransaction(tx);

  console.log(`\n🎉 TRANSACTION BROADCAST SUCCESSFUL!`);
  console.log(`🔗 Transaction Hash: ${txHash}`);
  console.log(`🌐 Explorer Link: https://pudge.explorer.nervos.org/transaction/${txHash}`);

  console.log("\n⏳ Waiting for on-chain confirmation (polling RPC)...");
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

  console.log("\n🏁 Class 1 Practical Execution Complete!\n");
}

main().catch((err) => {
  console.error("❌ Execution Error:", err);
  process.exit(1);
});
