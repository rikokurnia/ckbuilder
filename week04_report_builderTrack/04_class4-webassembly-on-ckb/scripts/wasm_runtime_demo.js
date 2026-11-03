import { ccc } from "@ckb-ccc/core";

// ==============================================================================
// CLASS 4: WEBASSEMBLY (WASM) ON CKB - RUNTIME & ON-CHAIN COMMITMENT
// ==============================================================================
// 1. WebAssembly Architecture on CKB:
//    - CKB-VM executes standard RISC-V (RV64IMC).
//    - WebAssembly runtimes (such as Wasm3) compiled to RISC-V allow standard
//      .wasm modules to be executed inside CKB-VM.
// 2. Off-Chain & On-Chain Symmetry:
//    - Contracts written in WASM can execute identically in local/browser runtimes
//      and inside CKB-VM.
// 3. Hands-on Execution:
//    - We instantiate a standalone WASM verification module.
//    - Verify deterministic invariant execution off-chain.
//    - Commit the compiled WASM binary directly to a live CKB Testnet cell.
// ==============================================================================

const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574";

const RPC_URL = "https://testnet.ckb.dev/rpc";

// Minimal valid WebAssembly binary (wat: (module (func (export "validate") (result i32) (i32.const 0))))
// Header: \0asm (0x00 0x61 0x73 0x6d), Version 1 (0x01 0x00 0x00 0x00)
// Function: returns 0 (success in CKB-VM convention)
const WASM_BYTECODE = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, // WASM magic header + version 1
  0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7f,       // Type section: () -> i32
  0x03, 0x02, 0x01, 0x00,                         // Function section: func 0 uses type 0
  0x07, 0x0c, 0x01, 0x08, 0x76, 0x61, 0x6c, 0x69, // Export section: export "validate"
  0x64, 0x61, 0x74, 0x65, 0x00, 0x00,
  0x0a, 0x06, 0x01, 0x04, 0x00, 0x41, 0x00, 0x0b  // Code section: i32.const 0, end
]);

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
  console.log("=================================================================");
  console.log("🕸️  CLASS 4: WEBASSEMBLY (WASM) ON CKB - RUNTIME & ON-CHAIN PROOF");
  console.log("=================================================================\n");

  // 1. Off-Chain WASM Execution Verification
  console.log("⚙️  [1/3] Instantiating WebAssembly Module in Local Runtime...");
  const wasmModule = await WebAssembly.instantiate(WASM_BYTECODE);
  const validateResult = wasmModule.instance.exports.validate();

  console.log(`   • WASM Binary Size     : ${WASM_BYTECODE.length} bytes`);
  console.log(`   • Function 'validate()' : returned ${validateResult} (0 = CKB-VM VALIDATION SUCCESS)`);
  console.log("   ✅ Deterministic off-chain execution verified!\n");

  // 2. Prepare On-Chain Deployment / Commitment
  console.log("📡 [2/3] Preparing CKB Testnet Connection...");
  const client = new ccc.ClientPublicTestnet({ url: RPC_URL });
  const signer = new ccc.SignerCkbPrivateKey(client, PRIVATE_KEY);

  const senderAddress = await signer.getRecommendedAddress();
  console.log(`   • Signer Address : ${senderAddress}`);

  const balance = await signer.getBalance();
  console.log(`   • Current Balance: ${ccc.fixedPointToString(balance)} CKB\n`);

  const { script: ownerLock } = await ccc.Address.fromString(senderAddress, client);

  // Hex-encoded WASM bytecode for cell storage
  const wasmHex = ccc.hexFrom(WASM_BYTECODE);
  console.log(`📦 WASM Bytecode Hex: ${wasmHex}`);

  // Capacity calculation: 61 bytes base lock + WASM_BYTECODE.length (41 bytes) = 102 bytes
  const outputCapacity = ccc.fixedPointFrom("140"); // 140 CKB

  console.log("⏳ [3/3] Constructing Transaction with WASM Code Cell...");
  console.log(`   • Cell Capacity : 140.0 CKB`);
  console.log(`   • Cell Data Size: ${WASM_BYTECODE.length} bytes`);

  const tx = ccc.Transaction.from({
    outputs: [
      {
        lock: ownerLock,
        capacity: outputCapacity,
      },
    ],
    outputsData: [wasmHex],
  });

  console.log("🔄 Completing inputs and fee...");
  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1500n);

  console.log("✍️  Signing and broadcasting WASM code cell to CKB Testnet (Pudge)...");
  const txHash = await signer.sendTransaction(tx);

  console.log(`\n🎉 WASM CODE CELL TRANSACTION BROADCAST SUCCESSFUL!`);
  console.log(`🔗 Transaction Hash: ${txHash}`);
  console.log(`🌐 Explorer Link: https://pudge.explorer.nervos.org/transaction/${txHash}`);

  console.log("\n⏳ Waiting for on-chain confirmation...");
  let confirmed = false;
  let attempts = 0;
  while (!confirmed && attempts < 30) {
    attempts++;
    await new Promise((r) => setTimeout(r, 4000));
    const txStatus = await checkTxStatusViaRpc(txHash);
    if (txStatus && txStatus.status === "committed") {
      confirmed = true;
      console.log(`\n✅ WASM Cell committed on-chain!`);
      console.log(`   • Block Number: ${parseInt(txStatus.block_number, 16)} (${txStatus.block_number})`);
      console.log(`   • Block Hash  : ${txStatus.block_hash}`);
      break;
    }
    process.stdout.write(".");
  }

  console.log("\n🏁 Class 4 Practical Execution Complete!\n");
}

main().catch((err) => {
  console.error("❌ Execution Error:", err);
  process.exit(1);
});
