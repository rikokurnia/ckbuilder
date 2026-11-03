import { ccc } from "@ckb-ccc/core";

// Class 10: Language Choices for CKB Smart Contract Development
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
    return json?.result?.tx_status;
  } catch (err) {
    return null;
  }
}

async function main() {
  console.log("Class 10: Language Choices for CKB Smart Contract Development");
  console.log("------------------------------------------------------------");

  console.log("Language trade-offs on CKB-VM (RISC-V):");
  console.log("- Rust (ckb-std): Native RISC-V ELF, zero overhead, lowest cycles, strict memory safety.");
  console.log("- C / C++       : Ultra-compact binaries, minimal cycles, manual memory management.");
  console.log("- JavaScript    : ckb-js-vm (Duktape), fastest development velocity, higher cycle cost.");
  console.log("- WebAssembly   : Multi-language portability (Go, Zig, AssemblyScript), cross-platform symmetry.");

  const client = new ccc.ClientPublicTestnet({ url: RPC_URL });
  const signer = new ccc.SignerCkbPrivateKey(client, PRIVATE_KEY);

  const senderAddress = await signer.getRecommendedAddress();
  console.log(`Signer address: ${senderAddress}`);

  const balance = await signer.getBalance();
  console.log(`Current balance: ${ccc.fixedPointToString(balance)} CKB`);

  const { script: ownerLock } = await ccc.Address.fromString(senderAddress, client);

  // Architectural commitment payload summarizing the multi-language paradigm
  const summaryPayload = JSON.stringify({
    course: "CKB Script Development Course",
    completion: "Classes 1 - 10",
    languages: ["Rust (ckb-std)", "C/C++", "JavaScript (ckb-js-vm)", "WebAssembly (WASM)"],
    vm_target: "RISC-V (RV64IMC)",
    validation_model: "Off-chain computation, on-chain verification",
  });

  const summaryBytes = new TextEncoder().encode(summaryPayload);
  const summaryHex = ccc.hexFrom(summaryBytes);
  const cellCapacity = ccc.fixedPointFrom("250"); // 250 CKB

  console.log(`Commitment payload size: ${summaryBytes.length} bytes`);

  const tx = ccc.Transaction.from({
    outputs: [
      {
        lock: ownerLock,
        capacity: cellCapacity,
      },
    ],
    outputsData: [summaryHex],
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

  console.log("Class 10 execution complete.\n");
}

main().catch((err) => {
  console.error("Execution error:", err);
  process.exit(1);
});
