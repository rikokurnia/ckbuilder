import { ccc } from "@ckb-ccc/core";

const SENDER_PRIVKEY = "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574";
const RPC_URL = "https://testnet.ckb.dev";
const client = new ccc.ClientPublicTestnet({
  url: RPC_URL,
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
  while (true) {
    const txStatus = await checkTxStatusViaRpc(txHash);
    if (txStatus && txStatus.status === "committed") {
      const blockNum = parseInt(txStatus.block_number, 16);
      console.log(`✅ Transaction committed in block ${blockNum} (${txStatus.block_hash})`);
      break;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Reading the on-chain live cell data back from the chain
  console.log("\nFetching live cell data from blockchain...");
  await new Promise((r) => setTimeout(r, 1000));
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
  const outputData = cellJson?.result?.cell?.data?.content;
  if (outputData) {
    const retrievedData = hexToUtf8(outputData);
    console.log(`✅ Successfully Read Data From On-Chain Cell: "${retrievedData}"`);
  }
}

main().catch(console.error);
