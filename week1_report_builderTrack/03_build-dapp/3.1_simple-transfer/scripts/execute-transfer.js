import { ccc } from "@ckb-ccc/core";

const SENDER_PRIVKEY = "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574";
const RPC_URL = "https://testnet.ckb.dev";
const client = new ccc.ClientPublicTestnet({
  url: RPC_URL,
});
const signer = new ccc.SignerCkbPrivateKey(client, SENDER_PRIVKEY);

async function checkTxStatusViaRpc(txHash) {
  try {
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: 2,
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
    const txStatus = await checkTxStatusViaRpc(txHash);
    if (txStatus && txStatus.status === "committed") {
      const blockNum = parseInt(txStatus.block_number, 16);
      console.log(`✅ Transaction committed in block ${blockNum} (${txStatus.block_hash})`);
      break;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  const balanceAfter = await signer.getBalance();
  console.log(`Balance after: ${ccc.fixedPointToString(balanceAfter)} CKB`);
}

main().catch(console.error);
