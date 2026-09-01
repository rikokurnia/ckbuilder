import { ccc } from "@ckb-ccc/core";

const SENDER_PRIVKEY = "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574";
const client = new ccc.ClientPublicTestnet({
  url: "https://testnet.ckb.dev",
});
const signer = new ccc.SignerCkbPrivateKey(client, SENDER_PRIVKEY);

async function main() {
  const senderAddress = await signer.getRecommendedAddress();
  console.log(`Sender Address: ${senderAddress}`);

  const balanceBefore = await signer.getBalance();
  console.log(`Balance before: ${ccc.fixedPointToString(balanceBefore)} CKB`);

  // Target recipient address (transferring 100 CKB)
  const toAddress = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwy0rpn3trq0sj2q6arv7xaq9w6m6xa0egxe8xvr";
  const amountInCKB = "100";
  const { script: toLock } = await ccc.Address.fromString(toAddress, client);

  console.log(`\nInitiating transfer of ${amountInCKB} CKB to ${toAddress}...`);

  const tx = ccc.Transaction.from({
    outputs: [{ lock: toLock, capacity: ccc.fixedPointFrom(amountInCKB) }],
    outputsData: ["0x"],
  });

  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1000);

  console.log("Sending transaction to CKB Testnet...");
  const txHash = await signer.sendTransaction(tx);

  console.log(`\n🎉 Transaction successfully sent!`);
  console.log(`Transaction Hash: ${txHash}`);
  console.log(`Explorer Link: https://pudge.explorer.nervos.org/transaction/${txHash}`);

  console.log("\nWaiting for on-chain confirmation...");
  while (true) {
    const txState = await client.getTransaction(txHash);
    if (txState && txState.status && txState.status.status === "committed") {
      console.log(`✅ Transaction committed in block ${txState.status.blockNumber} (${txState.status.blockHash})`);
      break;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  const balanceAfter = await signer.getBalance();
  console.log(`Balance after: ${ccc.fixedPointToString(balanceAfter)} CKB`);
}

main().catch(console.error);
