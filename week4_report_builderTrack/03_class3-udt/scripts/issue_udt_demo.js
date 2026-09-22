import { ccc } from "@ckb-ccc/core";

// ==============================================================================
// CLASS 3: USER DEFINED TOKENS (sUDT - RFC 0025) ON CKB TESTNET
// ==============================================================================
// 1. sUDT Script:
//    - code_hash: 0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4
//    - hash_type: "type"
//    - args     : Owner Lock Script Hash (determines the token issuer)
// 2. Data Layout:
//    - Exactly 16 bytes (128-bit little-endian unsigned integer, u128)
// 3. Validation Rule:
//    - If owner's lock is in inputs => Minting authorized
//    - Else => sum(input_amount) >= sum(output_amount)
// ==============================================================================

const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574";

const RPC_URL = "https://testnet.ckb.dev/rpc";

const TESTNET_SUDT = {
  codeHash: "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
  hashType: "type",
  cellDep: {
    outPoint: {
      txHash: "0xe12877ebd2c3c364dc46c5c992bcfaf4fee33fa13eebdf82c591fc9825aab769",
      index: 0,
    },
    depType: "code",
  },
};

function encodeU128LE(amount) {
  const buf = Buffer.alloc(16);
  const big = BigInt(amount);
  buf.writeBigUInt64LE(big & 0xffffffffffffffffn, 0);
  buf.writeBigUInt64LE(big >> 64n, 8);
  return "0x" + buf.toString("hex");
}

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
  console.log("🪙 CLASS 3: USER DEFINED TOKEN (sUDT) - ON-CHAIN ISSUANCE");
  console.log("=================================================================\n");

  const client = new ccc.ClientPublicTestnet({ url: RPC_URL });
  const signer = new ccc.SignerCkbPrivateKey(client, PRIVATE_KEY);

  const senderAddress = await signer.getRecommendedAddress();
  console.log(`👤 Issuer Address: ${senderAddress}`);

  const balance = await signer.getBalance();
  console.log(`💰 Current Balance: ${ccc.fixedPointToString(balance)} CKB\n`);

  // 1. Resolve Owner Lock Script & Calculate Owner Lock Hash (sUDT Args)
  const { script: ownerLock } = await ccc.Address.fromString(senderAddress, client);
  const ownerLockHash = ownerLock.hash();

  console.log(`🔑 Owner Lock Hash (sUDT Args): ${ownerLockHash}`);

  // 2. Define sUDT Type Script
  const sudtType = ccc.Script.from({
    codeHash: TESTNET_SUDT.codeHash,
    hashType: TESTNET_SUDT.hashType,
    args: ownerLockHash,
  });

  // 3. Define Token Mint Amount (e.g. 10,000,000 tokens)
  const mintAmount = 10_000_000n;
  const encodedAmount = encodeU128LE(mintAmount);

  console.log(`💎 Mint Amount: ${mintAmount.toLocaleString()} tokens`);
  console.log(`📦 16-byte Little-Endian Encoded Data: ${encodedAmount}`);

  // 4. Assemble Cell
  // Storage requirement: 8 (cap) + 61 (lock) + 65 (type) + 16 (data) = 150 bytes -> 150 CKB
  const outputCapacity = ccc.fixedPointFrom("160"); // 160 CKB with safety margin

  const tx = ccc.Transaction.from({
    cellDeps: [
      {
        outPoint: {
          txHash: TESTNET_SUDT.cellDep.outPoint.txHash,
          index: TESTNET_SUDT.cellDep.outPoint.index,
        },
        depType: TESTNET_SUDT.cellDep.depType,
      },
    ],
    outputs: [
      {
        lock: ownerLock,
        type: sudtType,
        capacity: outputCapacity,
      },
    ],
    outputsData: [encodedAmount],
  });

  console.log("\n🔄 Completing inputs and fee for sUDT issuance...");
  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1500n);

  console.log("✍️  Signing and broadcasting sUDT issuance to CKB Testnet (Pudge)...");
  const txHash = await signer.sendTransaction(tx);

  console.log(`\n🎉 sUDT ISSUANCE TRANSACTION BROADCAST SUCCESSFUL!`);
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
      console.log(`\n✅ sUDT Minting committed on-chain!`);
      console.log(`   • Block Number: ${parseInt(txStatus.block_number, 16)} (${txStatus.block_number})`);
      console.log(`   • Block Hash  : ${txStatus.block_hash}`);
      break;
    }
    process.stdout.write(".");
  }

  console.log("\n🏁 Class 3 Practical Execution Complete!\n");
}

main().catch((err) => {
  console.error("❌ Execution Error:", err);
  process.exit(1);
});
