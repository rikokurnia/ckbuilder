import { ccc } from "@ckb-ccc/core";

const SENDER_PRIVKEY = "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574";
const client = new ccc.ClientPublicTestnet({
  url: "https://testnet.ckb.dev",
});
const signer = new ccc.SignerCkbPrivateKey(client, SENDER_PRIVKEY);

function utf8ToHex(utf8String) {
  const encoder = new TextEncoder();
  const uint8Array = encoder.encode(utf8String);
  return (
    "0x" +
    Array.prototype.map
      .call(uint8Array, (byte) => {
        return ("0" + (byte & 0xff).toString(16)).slice(-2);
      })
      .join("")
  );
}

function hexToUtf8(hexString) {
  const decoder = new TextDecoder("utf-8");
  const cleanedHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
  const uint8Array = new Uint8Array(
    cleanedHex.match(/[\da-f]{2}/gi).map((h) => parseInt(h, 16))
  );
  return decoder.decode(uint8Array);
}

async function main() {
  const signerAddress = await signer.getAddressObjSecp256k1();
  console.log(`Signer Address: ${signerAddress.toString()}`);

  const message = "Hello Nervos CKB! Data stored on Cell by CKBuilder Week 1.";
  const messageHex = utf8ToHex(message);
  console.log(`\nStoring On-Chain Message: "${message}"`);
  console.log(`Hex Representation: ${messageHex}`);

  // Build transaction with data in output cell
  const tx = ccc.Transaction.from({
    outputs: [{ lock: signerAddress.script }],
    outputsData: [messageHex],
  });

  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1000);

  console.log("\nSending transaction to CKB Testnet...");
  const txHash = await signer.sendTransaction(tx);

  console.log(`\n🎉 Data Storage Transaction successfully sent!`);
  console.log(`Transaction Hash: ${txHash}`);
  console.log(`Explorer Link: https://pudge.explorer.nervos.org/transaction/${txHash}`);

  console.log("\nWaiting for on-chain confirmation...");
  let blockNumber = null;
  while (true) {
    const txState = await client.getTransaction(txHash);
    if (txState && txState.status && txState.status.status === "committed") {
      blockNumber = txState.status.blockNumber;
      console.log(`✅ Transaction committed in block ${blockNumber} (${txState.status.blockHash})`);
      break;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Reading the on-chain live cell data back from the chain
  console.log("\nFetching live cell data from blockchain...");
  const liveCell = await client.getCellLive({ txHash, index: "0x0" }, true);
  if (liveCell) {
    const retrievedData = hexToUtf8(liveCell.outputData);
    console.log(`✅ Successfully Read Data From On-Chain Cell: "${retrievedData}"`);
    console.log(`Cell Capacity: ${ccc.fixedPointToString(liveCell.output.capacity)} CKB`);
  }
}

main().catch(console.error);
