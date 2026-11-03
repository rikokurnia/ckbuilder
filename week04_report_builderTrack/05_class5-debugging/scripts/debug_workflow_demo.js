import { ccc } from "@ckb-ccc/core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ==============================================================================
// CLASS 5: CKB SCRIPT DEBUGGING & CYCLE ANALYSIS WORKFLOW
// ==============================================================================
// 1. Debugging Paradigm:
//    - CKB-VM execution is fully reproducible offline using transaction dumps.
//    - Contracts emit debug messages via `ckb_debug` syscall.
//    - Errors return explicit integer exit codes (0 = Success, non-zero = Failure).
// 2. Practical Workflow:
//    - Step A: Simulate a failure case (e.g. Insufficient Capacity Invariant).
//    - Step B: Export mock transaction JSON dump for offline ckb-debugger inspection.
//    - Step C: Apply corrective fix, execute, and broadcast to CKB Testnet.
//    - Step D: Extract exact CKB-VM cycle consumption from RPC.
// ==============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  console.log("=================================================================");
  console.log("🐛 CLASS 5: CKB SCRIPT DEBUGGING & CYCLE ANALYSIS WORKFLOW");
  console.log("=================================================================\n");

  const client = new ccc.ClientPublicTestnet({ url: RPC_URL });
  const signer = new ccc.SignerCkbPrivateKey(client, PRIVATE_KEY);

  const senderAddress = await signer.getRecommendedAddress();
  console.log(`👤 Signer Address: ${senderAddress}`);

  const balance = await signer.getBalance();
  console.log(`💰 Current Balance: ${ccc.fixedPointToString(balance)} CKB\n`);

  const { script: ownerLock } = await ccc.Address.fromString(senderAddress, client);

  // ----------------------------------------------------------------------------
  // STEP A: DIAGNOSTIC SIMULATION (Reproducing Capacity Violation)
  // ----------------------------------------------------------------------------
  console.log("🔬 [Step A] Simulating Invariant Violation (Insufficient Capacity)...");
  const testPayload = "CKB Debugger: Cycle Analysis & Mock Tx Dump [Class 5]";
  const testData = ccc.hexFrom(new TextEncoder().encode(testPayload));

  // Required size: 61 bytes lock + 53 bytes data = 114 bytes -> minimum 114 CKB
  // Intentionally set under minimum to test validation failure
  const deficientCapacity = ccc.fixedPointFrom("50"); // 50 CKB (Deficient!)

  console.log("   • Attempting cell creation with only 50.0 CKB for a 114-byte cell...");
  try {
    const faultyTx = ccc.Transaction.from({
      outputs: [{ lock: ownerLock, capacity: deficientCapacity }],
      outputsData: [testData],
    });
    // Validate cell occupied capacity constraint
    const occupied = faultyTx.outputs[0].occupiedSize;
    if (faultyTx.outputs[0].capacity < occupied) {
      throw new Error(
        `Invariant Violation: Output[0] capacity (${ccc.fixedPointToString(
          faultyTx.outputs[0].capacity
        )} CKB) is less than occupied capacity (${ccc.fixedPointToString(
          occupied
        )} CKB)!`
      );
    }
  } catch (err) {
    console.log(`   ⚠️  Detected Expected Invariant Error: "${err.message}"`);
    console.log("   ✅ Diagnostic passed: Error caught before invalid state reached network.\n");
  }

  // ----------------------------------------------------------------------------
  // STEP B: GENERATING STANDALONE MOCK TRANSACTION DUMP FOR CKB-DEBUGGER
  // ----------------------------------------------------------------------------
  console.log("📦 [Step B] Exporting Mock Transaction Dump for Offline Debugging...");
  const validCapacity = ccc.fixedPointFrom("150"); // 150 CKB (Corrected!)

  const correctedTx = ccc.Transaction.from({
    outputs: [
      {
        lock: ownerLock,
        capacity: validCapacity,
      },
    ],
    outputsData: [testData],
  });

  await correctedTx.completeInputsByCapacity(signer);
  await correctedTx.completeFeeBy(signer, 1500n);

  const mockDumpPath = path.resolve(__dirname, "../mock_tx_dump.json");
  const dumpPayload = {
    mock_info: {
      description: "Class 5 Debugging Mock Transaction Dump for CKB-Debugger",
      target_network: "ckb_testnet",
      created_at: new Date().toISOString(),
    },
    transaction: {
      version: correctedTx.version,
      cell_deps: correctedTx.cellDeps,
      header_deps: correctedTx.headerDeps,
      inputs: correctedTx.inputs,
      outputs: correctedTx.outputs,
      outputs_data: correctedTx.outputsData,
      witnesses: correctedTx.witnesses,
    },
  };

  fs.writeFileSync(
    mockDumpPath,
    JSON.stringify(dumpPayload, (key, value) => (typeof value === "bigint" ? value.toString() : value), 2)
  );
  console.log(`   • Saved mock dump to: ${mockDumpPath}`);
  console.log("   ✅ Mock dump ready for offline analysis via ckb-debugger!\n");

  // ----------------------------------------------------------------------------
  // STEP C: ON-CHAIN EXECUTION & CYCLE CONSUMPTION MEASUREMENT
  // ----------------------------------------------------------------------------
  console.log("🚀 [Step C] Broadcasting Corrected Transaction to CKB Testnet...");
  const txHash = await signer.sendTransaction(correctedTx);

  console.log(`\n🎉 TRANSACTION BROADCAST SUCCESSFUL!`);
  console.log(`🔗 Transaction Hash: ${txHash}`);
  console.log(`🌐 Explorer Link: https://pudge.explorer.nervos.org/transaction/${txHash}`);

  console.log("\n⏳ Waiting for on-chain confirmation & cycle profiling...");
  let confirmed = false;
  let attempts = 0;
  while (!confirmed && attempts < 30) {
    attempts++;
    await new Promise((r) => setTimeout(r, 4000));
    const txResult = await checkTxStatusViaRpc(txHash);
    if (txResult && txResult.tx_status && txResult.tx_status.status === "committed") {
      confirmed = true;
      const cycles = txResult.cycles ? parseInt(txResult.cycles, 16) : 0;
      const fee = txResult.fee ? parseInt(txResult.fee, 16) : 0;

      console.log(`\n✅ Transaction committed on-chain!`);
      console.log(`   • Block Number      : ${parseInt(txResult.tx_status.block_number, 16)} (${txResult.tx_status.block_number})`);
      console.log(`   • Block Hash        : ${txResult.tx_status.block_hash}`);
      console.log(`   • Cycles Consumed   : ${cycles.toLocaleString()} cycles (${txResult.cycles})`);
      console.log(`   • Transaction Fee   : ${fee} Shannons (${txResult.fee})`);
      console.log(`   • VM Return Code    : 0 (OK)`);
      break;
    }
    process.stdout.write(".");
  }

  console.log("\n🏁 Class 5 Practical Execution Complete!\n");
}

main().catch((err) => {
  console.error("❌ Execution Error:", err);
  process.exit(1);
});
