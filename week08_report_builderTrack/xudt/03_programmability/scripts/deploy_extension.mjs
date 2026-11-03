import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { ccc } from "@ckb-ccc/core";
import {
  RPC_URL,
  XUDT_ROOT,
  explorerTx,
  loadState,
  makeClient,
  makeSigner,
  ckbToShannons,
  saveState,
  waitCommitted,
} from "../../scripts/common.mjs";

const BINARY_NAME = process.env.EXTENSION_BINARY || "transfer_cap.elf";
const SO_PATH = path.join(XUDT_ROOT, "03_programmability", "scripts", BINARY_NAME);
const FORCE = process.env.FORCE === "1";

function line(title) {
  console.log(`\n== ${title} ==`);
}

async function main() {
  const client = makeClient();
  const { signer, address, lock, lockHash } = await makeSigner(client);
  const state = loadState() || { network: "testnet", rpc: RPC_URL };

  line("BEFORE");
  console.log(`signer:    ${address}`);
  console.log(`balance:   ${ccc.fixedPointToString(await signer.getBalance())} CKB`);

  if (state.extension && !FORCE) {
    console.log("\nExtension already deployed in state file. Set FORCE=1 to deploy another.");
    console.log(JSON.stringify(state.extension, null, 2));
    return;
  }
  if (!fs.existsSync(SO_PATH)) {
    throw new Error(`missing ${SO_PATH}; run build.sh first`);
  }

  const binary = fs.readFileSync(SO_PATH);
  const codeHash = ccc.hashCkb(binary);
  const binarySha256 = crypto.createHash("sha256").update(binary).digest("hex");
  const requestedCapacity = ckbToShannons(8 + binary.length);

  line("extension code cell");
  console.log(`source:     ${path.relative(process.cwd(), SO_PATH)}`);
  console.log(`binary:     ${binary.length} bytes`);
  console.log(`sha256:     ${binarySha256}`);
  console.log(`code hash:  ${codeHash} (ckb blake2b, data1)`);
  console.log(`requested:  ${ccc.fixedPointToString(requestedCapacity)} CKB`);

  const tx = ccc.Transaction.from({
    outputs: [{ lock, capacity: requestedCapacity }],
    outputsData: [ccc.hexFrom(binary)],
  });

  // A cell holding data must also cover its own overhead, so the capacity that
  // actually lands on chain is the one carried by the built output.
  const capacity = tx.outputs[0].capacity;
  console.log(`capacity:   ${ccc.fixedPointToString(capacity)} CKB (on-chain value)`);

  line("balancing");
  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1500n);
  console.log(`inputs:  ${tx.inputs.length}`);
  console.log(`outputs: ${tx.outputs.length}`);
  console.log(`fee:     ${ccc.fixedPointToString(await tx.getFee(client))} CKB`);

  if (process.env.DRY_RUN === "1") {
    console.log("\nDRY_RUN=1: transaction built and balanced, not broadcast");
    return;
  }

  line("broadcast");
  const txHash = await signer.sendTransaction(tx);
  console.log(`tx:        ${txHash}`);
  console.log(`explorer:  ${explorerTx(txHash)}`);

  line("wait for commit");
  const committed = await waitCommitted(txHash);
  console.log(`\nstatus:    ${committed.status}`);
  console.log(`block:     ${committed.blockNumber}`);

  const cell = await client.getCellLive({ txHash, index: 0 }, true);
  if (!cell) {
    throw new Error("deployed code cell is not live");
  }
  const onchainHash = ccc.hashCkb(ccc.bytesFrom(cell.outputData));
  console.log(`on-chain data hash: ${onchainHash}`);
  if (onchainHash !== codeHash) {
    throw new Error("on-chain code hash mismatch");
  }

  state.extension = {
    codeHash,
    hashType: "data1",
    outPoint: { txHash, index: 0 },
    capacity: capacity.toString(),
    binaryFile: BINARY_NAME,
    binaryBytes: binary.length,
    binarySha256,
    deployTx: txHash,
    blockNumber: committed.blockNumber,
    ownerLockHash: lockHash,
  };
  saveState(state);

  line("saved");
  console.log(path.relative(process.cwd(), path.join(XUDT_ROOT, "03_programmability", "scripts", "deployment.testnet.json")));
  console.log(JSON.stringify(state.extension, null, 2));
}

main().catch((e) => {
  console.error("\nExecution error:", e);
  process.exit(1);
});
