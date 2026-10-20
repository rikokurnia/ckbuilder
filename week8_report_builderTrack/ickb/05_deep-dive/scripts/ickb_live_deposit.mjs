#!/usr/bin/env node
// 05 · Live iCKB deposit: phase 1 (CKB -> deposit + receipt) and phase 2 (receipt -> iCKB).
//
//   node .../ickb_live_deposit.mjs --dry-run   build only, no signature, no broadcast
//   node .../ickb_live_deposit.mjs             sign, send, wait, persist deposit.json
//
// Both transactions use the vendored SDK builders: the public high-level conversion path
// only creates an order below the 100k iCKB cap, so the two documented phases are driven
// directly through IckbSdk and the LogicManager.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ccc } from "@ckb-ccc/core";
import {
  IckbSdk,
  WALLET_LOCK_UP,
  signAndSendTransaction,
} from "../../lib/ickb-sdk/index.ts";
import { getConfig } from "../../lib/ickb-sdk/constants.ts";

const RPC = "https://testnet.ckb.dev/rpc";
const PRIVATE_KEY =
  "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574";
const DEPOSIT_CKB = 1_082n;
const CKB = 100_000_000n;
const DRY_RUN = process.argv.includes("--dry-run");
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "deposit.json");

const fmt = (shannons) => {
  const value = shannons < 0n ? -shannons : shannons;
  const whole = value / CKB;
  const fraction = (value % CKB).toString().padStart(8, "0").replace(/0+$/, "");
  return `${shannons < 0n ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
};

const u32le = (hex, at = 0) => {
  const bytes = hex.slice(2 + at * 2, 2 + at * 2 + 8).match(/../g).reverse();
  return Number(BigInt("0x" + bytes.join("")));
};
const u64le = (hex, at = 0) => {
  const bytes = hex.slice(2 + at * 2, 2 + at * 2 + 16).match(/../g).reverse();
  return BigInt("0x" + bytes.join(""));
};

const client = new ccc.ClientPublicTestnet({ url: RPC });
const config = getConfig("testnet");
const sdk = IckbSdk.fromChain("testnet");
const signer = new ccc.SignerCkbPrivateKey(client, PRIVATE_KEY);
const lock = (await signer.getRecommendedAddressObj()).script;
const address = (await signer.getRecommendedAddressObj()).toString();

const readState = () => sdk.getL1AccountState(client, [lock], WALLET_LOCK_UP);
const liquidCells = (state) => [
  ...state.account.capacityCells,
  ...state.account.nativeUdtCells,
];

console.log(`RPC        : ${RPC}`);
console.log(`Wallet     : ${address}`);
console.log(`Deposit    : ${fmt(DEPOSIT_CKB * CKB)} CKB`);
console.log(`Mode       : ${DRY_RUN ? "dry run (nothing signed or sent)" : "live"}`);
console.log("");

console.log("1. Account state before deposit");
let state = await readState();
console.log(`  tip          : #${state.system.tip.number}`);
console.log(`  balance      : ${fmt(state.account.capacityCells.reduce((a, c) => a + c.cellOutput.capacity, 0n))} CKB in ${state.account.capacityCells.length} cell(s)`);
console.log(`  receipts     : ${state.account.receipts.length} (${fmt(state.account.receipts.reduce((a, r) => a + r.udtValue, 0n))} iCKB)`);
console.log(`  1 iCKB       : ${fmt((state.system.exchangeRatio.udtScale * CKB) / state.system.exchangeRatio.ckbScale)} CKB`);
console.log(`  fee rate     : ${state.system.feeRate} shannons/KB`);
console.log("");

const capacity = DEPOSIT_CKB * CKB;
let phase1 = config.ickbLogic.deposit({}, 1, capacity, lock);
phase1 = await sdk.completeTransaction(phase1, {
  signer,
  lock,
  feeRate: state.system.feeRate,
  cells: liquidCells(state),
});

const depositIndex = phase1.outputs.findIndex(
  (output) =>
    output.lock.eq(config.ickbLogic.script) &&
    output.type?.eq(config.ickbLogic.dao.script),
);
const receiptIndex = phase1.outputs.findIndex((output) =>
  output.type?.eq(config.ickbLogic.script),
);
if (depositIndex < 0 || receiptIndex < 0) {
  throw new Error("Phase 1 is missing the deposit or the receipt output");
}

console.log("2. Phase 1 transaction (CKB -> DAO deposit + iCKB receipt)");
console.log(`  inputs       : ${phase1.inputs.length}`);
console.log(`  outputs      : ${phase1.outputs.length}`);
console.log(`  deposit out  : #${depositIndex} ${fmt(phase1.outputs[depositIndex].capacity)} CKB (lock = iCKB Logic, type = Nervos DAO)`);
console.log(`  receipt out  : #${receiptIndex} ${fmt(phase1.outputs[receiptIndex].capacity)} CKB (type = iCKB Logic)`);
if (DRY_RUN) {
  console.log("  dry run: transaction built and completed, not signed or broadcast.");
  process.exit(0);
}

const phase1Hash = await signAndSendTransaction(signer, phase1);
console.log(`  sent         : ${phase1Hash}`);
const phase1Committed = await client.waitTransaction(phase1Hash, 0);
console.log(`  committed    : block #${phase1Committed.blockNumber}`);
console.log("");

console.log("3. Account state after phase 1");
state = await readState();
const receipt = state.account.receipts.find(
  (candidate) => candidate.cell.outPoint.txHash === phase1Hash,
);
if (!receipt) {
  throw new Error("Receipt not found in the refreshed account state");
}
console.log(`  receipt      : ${receipt.cell.outPoint.txHash}:${receipt.cell.outPoint.index}`);
console.log(`  deposit      : ${fmt(receipt.ckbValue)} CKB -> ${fmt(receipt.udtValue)} iCKB at header AR ${receipt.header.header.dao.ar}`);
console.log(`  receipt data : quantity ${u32le(receipt.cell.outputData)}, deposit ${fmt(u64le(receipt.cell.outputData, 4))} CKB`);
console.log("");

let phase2 = sdk.buildBaseTransaction(
  {},
  { availableOrders: [], receipts: [receipt], readyWithdrawals: [] },
);
phase2 = await sdk.completeTransaction(phase2, {
  signer,
  lock,
  feeRate: state.system.feeRate,
  cells: liquidCells(state),
});
const ickbIndex = phase2.outputs.findIndex((output) =>
  output.type?.eq(config.ickbUdt.script),
);
if (ickbIndex < 0) {
  throw new Error("Phase 2 is missing the iCKB output");
}
const minted = BigInt(
  "0x" +
    phase2.outputsData[ickbIndex]
      .slice(2, 34)
      .match(/../g)
      .reverse()
      .join(""),
);
console.log("4. Phase 2 transaction (iCKB receipt -> iCKB)");
console.log(`  inputs       : ${phase2.inputs.length} (includes the receipt)`);
console.log(`  outputs      : ${phase2.outputs.length}`);
console.log(`  iCKB out     : #${ickbIndex} ${fmt(minted)} iCKB at ${fmt(phase2.outputs[ickbIndex].capacity)} CKB`);
console.log("");

const phase2Hash = await signAndSendTransaction(signer, phase2);
console.log(`  sent         : ${phase2Hash}`);
const phase2Committed = await client.waitTransaction(phase2Hash, 0);
console.log(`  committed    : block #${phase2Committed.blockNumber}`);
console.log("");

console.log("5. Account state after phase 2");
state = await readState();
const ickbCells = state.account.nativeUdtCells;
const balance = ickbCells
  .filter((cell) => cell.cellOutput.type?.eq(config.ickbUdt.script))
  .reduce((sum, cell) => {
    const raw = cell.outputData.slice(2, 34);
    const bytes = raw.match(/../g).reverse().join("");
    return sum + BigInt("0x" + bytes);
  }, 0n);
console.log(`  iCKB cells   : ${ickbCells.length}`);
console.log(`  iCKB balance : ${fmt(balance)} iCKB`);
console.log(`  receipts     : ${state.account.receipts.length}`);
console.log("");

const evidence = {
  network: "testnet",
  address,
  depositCapacity: capacity.toString(),
  phase1: {
    txHash: phase1Hash,
    blockNumber: phase1Committed.blockNumber.toString(),
    depositOutPoint: { txHash: phase1Hash, index: depositIndex },
    receiptOutPoint: { txHash: phase1Hash, index: receiptIndex },
    receiptQuantity: u32le(receipt.cell.outputData),
    depositAmount: u64le(receipt.cell.outputData, 4).toString(),
    headerDaoAr: receipt.header.header.dao.ar.toString(),
  },
  phase2: {
    txHash: phase2Hash,
    blockNumber: phase2Committed.blockNumber.toString(),
    ickbOutPoint: { txHash: phase2Hash, index: ickbIndex },
    ickbAmount: minted.toString(),
  },
  createdAt: new Date().toISOString(),
};
writeFileSync(OUT, JSON.stringify(evidence, null, 2) + "\n");
console.log(`Evidence written to ${OUT}`);
console.log(`Explorer    : https://pudge.explorer.nervos.org/transaction/${phase1Hash}`);
console.log(`Explorer    : https://pudge.explorer.nervos.org/transaction/${phase2Hash}`);
