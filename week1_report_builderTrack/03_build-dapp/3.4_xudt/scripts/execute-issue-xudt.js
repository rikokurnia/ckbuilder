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
  const signerAddress = await signer.getAddressObjSecp256k1();
  const lockScript = signerAddress.script;
  console.log(`Issuer Address: ${signerAddress.toString()}`);

  const tokenAmount = "1000000"; // 1 Million tokens
  const xudtArgs = lockScript.hash() + "00000000";

  console.log(`\nPreparing xUDT Token Issuance...`);
  console.log(`Token Amount to Issue: ${tokenAmount} Tokens`);
  console.log(`xUDT Args (Issuer Lock Hash + flags): ${xudtArgs}`);

  const typeScript = await ccc.Script.fromKnownScript(
    client,
    ccc.KnownScript.XUdt,
    xudtArgs
  );

  const tx = ccc.Transaction.from({
    outputs: [{ lock: lockScript, type: typeScript }],
    outputsData: [ccc.numLeToBytes(tokenAmount, 16)],
  });

  await tx.addCellDepsOfKnownScripts(client, ccc.KnownScript.XUdt);
  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1000);

  console.log("\nBroadcasting xUDT Token Issuance transaction to CKB Testnet...");
  const txHash = await signer.sendTransaction(tx);

  console.log(`\n🎉 xUDT Token Issuance Transaction Successfully Sent!`);
  console.log(`Transaction Hash: ${txHash}`);
  console.log(`xUDT Args: ${xudtArgs}`);
  console.log(`Explorer Link: https://pudge.explorer.nervos.org/transaction/${txHash}`);

  console.log("\nWaiting for on-chain confirmation...");
  while (true) {
    const txStatus = await checkTxStatusViaRpc(txHash);
    if (txStatus && txStatus.status === "committed") {
      const blockNum = parseInt(txStatus.block_number, 16);
      console.log(`✅ xUDT Token Mint Committed in block ${blockNum} (${txStatus.block_hash})`);
      break;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Verify issued cell on-chain
  console.log("\nQuerying issued token cell from blockchain...");
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: 2,
      jsonrpc: "2.0",
      method: "get_live_cell",
      params: [{ tx_hash: txHash, index: "0x0" }, true],
    }),
  });
  const cellJson = await res.json();
  const rawData = cellJson?.result?.cell?.data?.content;
  if (rawData) {
    const tokenSupply = ccc.numFrom(rawData, "le");
    console.log(`✅ Verified On-Chain xUDT Supply: ${tokenSupply.toString()} Tokens`);
  }
}

main().catch(console.error);
