import { ccc } from "@ckb-ccc/core";

// Class 7: Advanced Duktape Examples (ckb-js-vm) on CKB Testnet
const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574";

const RPC_URL = "https://testnet.ckb.dev/rpc";

// Official ckb-js-vm on CKB Testnet
const CKB_JS_VM = {
  codeHash: "0x3e9b6bead927bef62fcb56f0c79f4fbd1b739f32dd222beac10d346f2918bed7",
  hashType: "type",
  cellDep: {
    outPoint: {
      txHash: "0x756fdaf0d1ba1d2e03dc13c71c967b24021bc054893a766ccee6879c468892d2",
      index: 0,
    },
    depType: "code",
  },
};

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
  console.log("Class 7: Advanced Duktape (ckb-js-vm) Smart Contract Deployment");
  console.log("-----------------------------------------------------------------");

  const client = new ccc.ClientPublicTestnet({ url: RPC_URL });
  const signer = new ccc.SignerCkbPrivateKey(client, PRIVATE_KEY);

  const senderAddress = await signer.getRecommendedAddress();
  console.log(`Signer address: ${senderAddress}`);

  const balance = await signer.getBalance();
  console.log(`Current balance: ${ccc.fixedPointToString(balance)} CKB`);

  const { script: ownerLock } = await ccc.Address.fromString(senderAddress, client);

  // JavaScript smart contract code targeted for Duktape CKB-VM
  const jsContractSource = `
// Advanced Duktape Validation Contract on CKB-VM
function main() {
  var script = CKB.load_script();
  var txHash = CKB.load_tx_hash();
  var inputCap = CKB.load_cell_capacity(0, CKB.SOURCE_INPUT);
  var outputCap = CKB.load_cell_capacity(0, CKB.SOURCE_OUTPUT);
  if (outputCap > inputCap) {
    throw new Error("InvalidCapacityConservation");
  }
  return 0;
}
main();
`.trim();

  const jsBytes = new TextEncoder().encode(jsContractSource);
  const jsHex = ccc.hexFrom(jsBytes);

  console.log(`Contract size: ${jsBytes.length} bytes`);
  console.log(`Target VM: ckb-js-vm (Duktape engine on RISC-V)`);
  console.log(`ckb-js-vm code_hash: ${CKB_JS_VM.codeHash}`);

  // Build transaction storing the Duktape contract code cell
  const cellCapacity = ccc.fixedPointFrom("180"); // 180 CKB

  const tx = ccc.Transaction.from({
    cellDeps: [
      {
        outPoint: {
          txHash: CKB_JS_VM.cellDep.outPoint.txHash,
          index: CKB_JS_VM.cellDep.outPoint.index,
        },
        depType: CKB_JS_VM.cellDep.depType,
      },
    ],
    outputs: [
      {
        lock: ownerLock,
        capacity: cellCapacity,
      },
    ],
    outputsData: [jsHex],
  });

  await tx.completeInputsByCapacity(signer);
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

  console.log("Class 7 execution complete.\n");
}

main().catch((err) => {
  console.error("Execution error:", err);
  process.exit(1);
});
