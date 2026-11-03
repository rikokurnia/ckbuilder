import { ccc } from "@ckb-ccc/core";

// Class 6: Type ID (RFC 0022) - Unique Upgradable Script Identity on CKB
const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574";

const RPC_URL = "https://testnet.ckb.dev/rpc";

const TYPE_ID_CODE_HASH =
  "0x00000000000000000000000000000000000000000000000000545950455f4944";

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
  console.log("Class 6: CKB Type ID Generation and On-Chain Verification");
  console.log("----------------------------------------------------------");

  const client = new ccc.ClientPublicTestnet({ url: RPC_URL });
  const signer = new ccc.SignerCkbPrivateKey(client, PRIVATE_KEY);

  const senderAddress = await signer.getRecommendedAddress();
  console.log(`Signer address: ${senderAddress}`);

  const balance = await signer.getBalance();
  console.log(`Current balance: ${ccc.fixedPointToString(balance)} CKB`);

  const { script: ownerLock } = await ccc.Address.fromString(senderAddress, client);

  // Payload for the Type ID cell
  const contractState = "Type ID Contract v1.0: Immutable Identity, Upgradable State [Class 6]";
  const stateBytes = new TextEncoder().encode(contractState);
  const stateHex = ccc.hexFrom(stateBytes);

  // Cell capacity calculation (61 lock + 65 type + 70 data = ~196 bytes)
  const cellCapacity = ccc.fixedPointFrom("220"); // 220 CKB

  // Build transaction with placeholder Type ID script
  const tx = ccc.Transaction.from({
    outputs: [
      {
        lock: ownerLock,
        type: ccc.Script.from({
          codeHash: TYPE_ID_CODE_HASH,
          hashType: "type",
          args: "0x" + "00".repeat(32), // placeholder 32-byte args
        }),
        capacity: cellCapacity,
      },
    ],
    outputsData: [stateHex],
  });

  // Complete inputs first to lock the first input cell
  await tx.completeInputsByCapacity(signer);

  // Compute RFC 0022 Type ID args: hash(inputs[0] | output_index)
  const firstInputBytes = ccc.bytesFrom(tx.inputs[0].toBytes());
  const outputIndexBuf = Buffer.alloc(8);
  outputIndexBuf.writeBigUInt64LE(0n); // output index 0
  const dataToHash = Buffer.concat([Buffer.from(firstInputBytes), outputIndexBuf]);
  const typeIdArgs = ccc.hashCkb(dataToHash);

  // Set computed Type ID args
  tx.outputs[0].type.args = typeIdArgs;

  console.log(`First input outpoint: ${tx.inputs[0].previousOutput.txHash}:${tx.inputs[0].previousOutput.index}`);
  console.log(`Computed Type ID args: ${typeIdArgs}`);
  console.log(`Type script code_hash: ${TYPE_ID_CODE_HASH}`);

  // Complete fees and sign
  await tx.completeFeeBy(signer, 1500n);

  console.log("Broadcasting transaction to CKB Testnet (Pudge)...");
  const txHash = await signer.sendTransaction(tx);

  console.log(`Transaction broadcasted: ${txHash}`);
  console.log(`Explorer link: https://pudge.explorer.nervos.org/transaction/${txHash}`);

  console.log("Waiting for on-chain confirmation...");
  let confirmed = false;
  let attempts = 0;
  while (!confirmed && attempts < 30) {
    attempts++;
    await new Promise((r) => setTimeout(r, 4000));
    const txStatus = await checkTxStatusViaRpc(txHash);
    if (txStatus && txStatus.status === "committed") {
      confirmed = true;
      console.log(`Transaction committed on-chain.`);
      console.log(`Block number: ${parseInt(txStatus.block_number, 16)} (${txStatus.block_number})`);
      console.log(`Block hash: ${txStatus.block_hash}`);
      break;
    }
    process.stdout.write(".");
  }

  console.log("Class 6 execution complete.\n");
}

main().catch((err) => {
  console.error("Execution error:", err);
  process.exit(1);
});
