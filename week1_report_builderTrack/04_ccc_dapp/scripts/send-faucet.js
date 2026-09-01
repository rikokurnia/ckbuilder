import { ccc } from "@ckb-ccc/core";

// ============================================================================
// FAUCET SCRIPT: TRANSFER TESTNET CKB TO USER'S METAMASK / CKB ADDRESS
// ============================================================================

const FUNDED_PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574";

const RECIPIENT_ADDRESS = process.argv[2];
const AMOUNT_CKB = process.argv[3] || "5000";

if (!RECIPIENT_ADDRESS) {
  console.error("Usage: node send-faucet.js <recipient_address_or_eth_address> [amount_ckb]");
  process.exit(1);
}

async function main() {
  console.log("=================================================================");
  console.log("💸 SENDING TESTNET CKB TO RECIPIENT ADDRESS");
  console.log("=================================================================\n");

  const client = new ccc.ClientPublicTestnet({
    url: "https://testnet.ckb.dev/rpc",
  });

  const signer = new ccc.SignerCkbPrivateKey(client, FUNDED_PRIVATE_KEY);
  const senderAddress = await signer.getRecommendedAddress();

  console.log(`📤 Sender Address:    ${senderAddress}`);
  console.log(`📥 Target Recipient:  ${RECIPIENT_ADDRESS}`);
  console.log(`💰 Transfer Amount:   ${AMOUNT_CKB} CKB\n`);

  // Parse recipient address or script
  let targetLock;
  if (RECIPIENT_ADDRESS.startsWith("0x") && RECIPIENT_ADDRESS.length === 42) {
    // Ethereum address: Omnilock / CCC handles Ethereum address mapping
    console.log("Ethereum address detected, resolving lock script via CCC...");
    const addrObj = await ccc.Address.fromString(RECIPIENT_ADDRESS, client);
    targetLock = addrObj.script;
  } else {
    const addrObj = await ccc.Address.fromString(RECIPIENT_ADDRESS, client);
    targetLock = addrObj.script;
  }

  const transferCapacity = ccc.fixedPointFrom(parseFloat(AMOUNT_CKB));

  console.log("⏳ Building transaction and completing inputs...");
  const tx = ccc.Transaction.from({
    outputs: [
      {
        lock: targetLock,
        capacity: transferCapacity,
      },
    ],
  });

  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1500n);

  console.log("✍️  Signing and broadcasting transaction...");
  const txHash = await signer.sendTransaction(tx);

  console.log(`\n🎉 TRANSFER SUCCESSFUL!`);
  console.log(`🔗 Transaction Hash: ${txHash}`);
  console.log(`🌐 Explorer Link: https://pudge.explorer.nervos.org/transaction/${txHash}\n`);
}

main().catch((err) => {
  console.error("❌ Error sending testnet CKB:", err);
  process.exit(1);
});
