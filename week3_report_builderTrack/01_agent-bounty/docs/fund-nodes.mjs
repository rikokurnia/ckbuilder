import * as ccc from "../frontend/node_modules/@ckb-ccc/core/dist/barrel.mjs";

const SENDER_PRIVKEY = "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574";
const RPC_URL = "https://testnet.ckb.dev";
const client = new ccc.ClientPublicTestnet({ url: RPC_URL });
const signer = new ccc.SignerCkbPrivateKey(client, SENDER_PRIVKEY);

async function checkTxStatus(txHash) {
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
    return json?.result?.tx_status?.status;
  } catch (e) {
    return null;
  }
}

async function fundNode(toAddress, amountCkb) {
  console.log(`[Fund] Transferring ${amountCkb} CKB to ${toAddress}...`);
  const { script: toLock } = await ccc.Address.fromString(toAddress, client);

  const tx = ccc.Transaction.from({
    outputs: [{ lock: toLock, capacity: ccc.fixedPointFrom(amountCkb.toString()) }],
    outputsData: ["0x"],
  });

  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1000);

  const txHash = await signer.sendTransaction(tx);
  console.log(`[Fund] Tx sent: ${txHash}`);
  console.log(`[Fund] Waiting for testnet confirmation...`);

  while (true) {
    const status = await checkTxStatus(txHash);
    if (status === "committed") {
      console.log(`[Fund] Confirmed on-chain!`);
      break;
    }
    await new Promise((r) => setTimeout(r, 4000));
  }
  return txHash;
}

async function main() {
  const args = process.argv.slice(2);
  const pIdx = args.indexOf("--p-addr");
  const rIdx = args.indexOf("--r-addr");

  if (pIdx === -1 || rIdx === -1) {
    console.error("Usage: node fund-nodes.mjs --p-addr <addr> --r-addr <addr>");
    process.exit(1);
  }

  const pAddr = args[pIdx + 1];
  const rAddr = args[rIdx + 1];

  const bal = await signer.getBalance();
  console.log(`[Deployer] Balance: ${ccc.fixedPointToString(bal)} CKB`);

  await fundNode(pAddr, 1200);
  await fundNode(rAddr, 200);

  console.log("[Deployer] Both nodes successfully funded!");
}

main().catch((err) => {
  console.error("Funding error:", err);
  process.exit(1);
});
