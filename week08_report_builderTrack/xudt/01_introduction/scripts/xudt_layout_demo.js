import { ccc } from "@ckb-ccc/core";
import {
  RPC_URL,
  decodeXudtData,
  explorerTx,
  findTokenCells,
  makeClient,
  makeSigner,
  rpc,
} from "../../scripts/common.mjs";

const WEEK7_TX =
  "0x36bc583f34bc903d2e736a7a7f856606373185f5d3e48bec894eb2ac875a4997";

function line(title) {
  console.log(`\n== ${title} ==`);
}

async function main() {
  const client = makeClient();
  const { address, lock, lockHash } = await makeSigner(client);
  const tip = await rpc("get_tip_header", []);
  const tipNumber = parseInt(tip.number, 16);
  const balance = await client.getBalanceSingle(lock);

  line("network");
  console.log(`RPC:        ${RPC_URL}`);
  console.log(`tip:        ${tipNumber} (0x${tipNumber.toString(16)})`);
  console.log(`signer:     ${address}`);
  console.log(`lock hash:  ${lockHash}`);
  console.log(`balance:    ${ccc.fixedPointToString(balance)} CKB`);

  line("live week-7 xUDT cell");
  const outPoint = { txHash: WEEK7_TX, index: 0 };
  const cell = await client.getCellLive(outPoint, true);
  if (!cell) {
    throw new Error(`cell ${WEEK7_TX}:0 is not live`);
  }
  const type = cell.cellOutput.type;
  if (!type) {
    throw new Error("cell has no type script");
  }

  console.log(`out point:  ${cell.outPoint.txHash}:${cell.outPoint.index}`);
  console.log(`capacity:   ${ccc.fixedPointToString(cell.cellOutput.capacity)} CKB`);
  console.log(`lock:       ${cell.cellOutput.lock.codeHash} (${cell.cellOutput.lock.hashType})`);
  console.log(`lock hash:  ${await cell.cellOutput.lock.hash()}`);
  console.log(`type:       ${type.codeHash} (${type.hashType})`);
  console.log(`type hash:  ${await type.hash()}`);
  console.log(`type args:  ${type.args}`);
  console.log(`raw data:   ${cell.outputData}`);
  console.log(`explorer:   ${explorerTx(WEEK7_TX)}`);

  line("xUDT data layout");
  const decoded = decodeXudtData(cell.outputData);
  console.log(`amount:     ${decoded.amount} units (u128 LE, first 16 bytes)`);
  console.log(`extra data: ${decoded.extraData} (${decoded.dataLength - 16} bytes after amount)`);

  line("xUDT args layout");
  const argBytes = Buffer.from(ccc.bytesFrom(type.args));
  if (argBytes.length < 32) {
    throw new Error(`args too short: ${argBytes.length} bytes`);
  }
  const ownerLockHash = "0x" + argBytes.subarray(0, 32).toString("hex");
  let flags = 0;
  let extensionData = "0x";
  if (argBytes.length >= 36) {
    flags = argBytes.readUInt32LE(32);
    extensionData = "0x" + argBytes.subarray(36).toString("hex");
  }
  console.log(`owner lock: ${ownerLockHash} (first 32 bytes)`);
  console.log(
    `flags:      ${flags} (0x${flags.toString(16)}, next 4 bytes LE)${argBytes.length === 32 ? " [legacy 32-byte args: no extension]" : ""}`,
  );
  console.log(
    `extension:  ${extensionData} (${Math.max(0, argBytes.length - 36)} bytes)`,
  );
  console.log(
    `owner == signer lock hash: ${ownerLockHash === lockHash ? "yes (owner mode available)" : "no"}`,
  );

  line("all live cells of this xUDT type");
  const cells = await findTokenCells(client, type);
  if (cells.length === 0) {
    console.log("(none)");
  }
  for (const c of cells) {
    const d = decodeXudtData(c.outputData);
    console.log(
      `${c.outPoint.txHash}:${c.outPoint.index}  ${ccc.fixedPointToString(c.cellOutput.capacity).padStart(10)} CKB  ${d.amount} units  lock=${await c.cellOutput.lock.hash()}`,
    );
  }

  line("takeaway");
  console.log("xUDT keeps the sUDT amount in cell data and moves all extension");
  console.log("semantics into type.args, so one script hash can carry many rules.");
}

main().catch((e) => {
  console.error("\nExecution error:", e);
  process.exit(1);
});
