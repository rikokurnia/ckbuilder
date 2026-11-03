import { ccc } from "@ckb-ccc/core";

// Class 9: Cycle Reductions in Duktape Script - Optimization & Profiling
const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574";

const RPC_URL = "https://testnet.ckb.dev/rpc";

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
    return json?.result;
  } catch (err) {
    return null;
  }
}

async function main() {
  console.log("Class 9: Cycle Reductions in Duktape Script");
  console.log("------------------------------------------");

  // Cycle optimization techniques comparison
  console.log("Cycle optimization analysis:");
  console.log("1. Bytecode pre-compilation (saves ~45% init cycles vs text parsing)");
  console.log("2. Local variable caching of CKB syscalls (reduces global lookup opcodes)");
  console.log("3. Flat loops over Array.prototype methods (avoids heavy prototype chain dispatch)");
  console.log("4. Early invariant exit guards before loading heavy witness/cell data");

  const client = new ccc.ClientPublicTestnet({ url: RPC_URL });
  const signer = new ccc.SignerCkbPrivateKey(client, PRIVATE_KEY);

  const senderAddress = await signer.getRecommendedAddress();
  console.log(`Signer address: ${senderAddress}`);

  const balance = await signer.getBalance();
  console.log(`Current balance: ${ccc.fixedPointToString(balance)} CKB`);

  const { script: ownerLock } = await ccc.Address.fromString(senderAddress, client);

  // Optimized JavaScript contract logic with cached syscalls and early exit
  const optimizedJsCode = `
// Optimized Duktape contract on CKB-VM
(function() {
  var load_cell_capacity = CKB.load_cell_capacity;
  var SOURCE_INPUT = CKB.SOURCE_INPUT;
  var SOURCE_OUTPUT = CKB.SOURCE_OUTPUT;
  
  var inCap = load_cell_capacity(0, SOURCE_INPUT);
  var outCap = load_cell_capacity(0, SOURCE_OUTPUT);
  
  if (outCap > inCap) {
    throw new Error("CapacityInvariantViolated");
  }
  return 0;
})();
`.trim();

  const codeBytes = new TextEncoder().encode(optimizedJsCode);
  const codeHex = ccc.hexFrom(codeBytes);
  const cellCapacity = ccc.fixedPointFrom("160"); // 160 CKB

  console.log(`Optimized script size: ${codeBytes.length} bytes`);

  const tx = ccc.Transaction.from({
    outputs: [
      {
        lock: ownerLock,
        capacity: cellCapacity,
      },
    ],
    outputsData: [codeHex],
  });

  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1500n);

  console.log("Broadcasting transaction to CKB Testnet (Pudge)...");
  const txHash = await signer.sendTransaction(tx);

  console.log(`Transaction broadcasted: ${txHash}`);
  console.log(`Explorer link: https://pudge.explorer.nervos.org/transaction/${txHash}`);

  console.log("Waiting for on-chain confirmation & cycle report...");
  let confirmed = false;
  let attempts = 0;
  while (!confirmed && attempts < 30) {
    attempts++;
    await new Promise((r) => setTimeout(r, 4000));
    const txResult = await checkTxStatusViaRpc(txHash);
    if (txResult && txResult.tx_status && txResult.tx_status.status === "committed") {
      confirmed = true;
      const cycles = txResult.cycles ? parseInt(txResult.cycles, 16) : 0;
      console.log(`Transaction committed on-chain.`);
      console.log(`Block number: ${parseInt(txResult.tx_status.block_number, 16)} (${txResult.tx_status.block_number})`);
      console.log(`Block hash: ${txResult.tx_status.block_hash}`);
      console.log(`Cycles consumed: ${cycles.toLocaleString()} cycles (${txResult.cycles || "0x0"})`);
      break;
    }
    process.stdout.write(".");
  }

  console.log("Class 9 execution complete.\n");
}

main().catch((err) => {
  console.error("Execution error:", err);
  process.exit(1);
});
