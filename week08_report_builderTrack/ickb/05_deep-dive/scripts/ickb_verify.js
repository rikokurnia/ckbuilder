#!/usr/bin/env node
// 05 · Read-only verification of the live deposit evidence written by ickb_live_deposit.mjs.
//
//   node .../ickb_verify.js
//
// Re-reads both transactions and the cells they produced from testnet, recomputes the
// mint from the receipt header, and prints a PASS/FAIL line per claim. No key, no spend.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ccc } from "@ckb-ccc/core";
import { getConfig } from "../../lib/ickb-sdk/constants.ts";
import { IckbSdk, WALLET_LOCK_UP } from "../../lib/ickb-sdk/index.ts";

const RPC = "https://testnet.ckb.dev/rpc";
const CKB = 100_000_000n;
const HERE = dirname(fileURLToPath(import.meta.url));
const EVIDENCE = join(HERE, "..", "deposit.json");

const checks = [];
function check(name, ok, detail) {
  checks.push({ name, ok });
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
}
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
const u128le = (hex) => {
  const bytes = hex.slice(2, 34).match(/../g).reverse();
  return BigInt("0x" + bytes.join(""));
};

const evidence = JSON.parse(readFileSync(EVIDENCE, "utf8"));
const config = getConfig("testnet");
const client = new ccc.ClientPublicTestnet({ url: RPC });

console.log("iCKB deposit evidence (read-only)");
console.log(`  network    : ${evidence.network}`);
console.log(`  wallet     : ${evidence.address}`);
console.log(`  deposit    : ${fmt(BigInt(evidence.depositCapacity))} CKB`);
console.log(`  created    : ${evidence.createdAt}`);
console.log("");

console.log("1. Phase 1 transaction and its outputs");
const phase1 = await client.getTransaction(evidence.phase1.txHash);
if (!phase1) {
  throw new Error(`Transaction ${evidence.phase1.txHash} not found`);
}
check("phase 1 is committed", phase1.blockHash !== undefined, `block #${phase1.blockNumber}`);
const phase1Tx = phase1.transaction;
const depositOut = phase1Tx.outputs[evidence.phase1.depositOutPoint.index];
const receiptOut = phase1Tx.outputs[evidence.phase1.receiptOutPoint.index];
const receiptData = phase1Tx.outputsData[evidence.phase1.receiptOutPoint.index];
check(
  "deposit output is an iCKB Logic-locked DAO cell",
  depositOut?.lock.eq(config.ickbLogic.script) &&
    depositOut?.type?.eq(config.ickbLogic.dao.script),
  `${fmt(depositOut.capacity)} CKB`,
);
check(
  "deposit data is the empty DAO payload",
  phase1Tx.outputsData[evidence.phase1.depositOutPoint.index] === "0x0000000000000000",
);
check(
  "receipt output carries the iCKB Logic type",
  receiptOut?.type?.eq(config.ickbLogic.script),
  `${fmt(receiptOut.capacity)} CKB`,
);
const quantity = u32le(receiptData);
const depositAmount = u64le(receiptData, 4);
check(
  "receipt decodes to one deposit of the recorded amount",
  quantity === 1 && depositAmount === BigInt(evidence.phase1.depositAmount),
  `quantity ${quantity}, deposit ${fmt(depositAmount)} CKB free`,
);
const header = await client.getHeaderByHash(phase1.blockHash);
check(
  "receipt header matches the phase 1 commit header",
  header !== undefined && header.dao.ar === BigInt(evidence.phase1.headerDaoAr),
  `AR ${header?.dao.ar}`,
);
console.log("");

console.log("2. Deposit and receipt cell status now");
const depositCell = await client.getCellLive(evidence.phase1.depositOutPoint, true);
check(
  "deposit cell is live and still locked by iCKB Logic",
  depositCell !== undefined && depositCell.cellOutput.lock.eq(config.ickbLogic.script),
  depositCell ? `${fmt(depositCell.cellOutput.capacity)} CKB` : "spent",
);
const receiptCell = await client.getCellLive(evidence.phase1.receiptOutPoint, true);
check("receipt cell was consumed by phase 2", receiptCell === undefined);
console.log("");

console.log("3. Phase 2 transaction and the minted iCKB");
const phase2 = await client.getTransaction(evidence.phase2.txHash);
if (!phase2) {
  throw new Error(`Transaction ${evidence.phase2.txHash} not found`);
}
check("phase 2 is committed", phase2.blockHash !== undefined, `block #${phase2.blockNumber}`);
const phase2Tx = phase2.transaction;
const spendsReceipt = phase2Tx.inputs.some(
  (input) =>
    input.previousOutput.txHash === evidence.phase1.receiptOutPoint.txHash &&
    Number(input.previousOutput.index) === evidence.phase1.receiptOutPoint.index,
);
check("phase 2 spends the receipt", spendsReceipt);
const ickbOut = phase2Tx.outputs[evidence.phase2.ickbOutPoint.index];
const ickbData = phase2Tx.outputsData[evidence.phase2.ickbOutPoint.index];
check(
  "phase 2 output is iCKB",
  ickbOut?.type?.eq(config.ickbUdt.script),
  `${fmt(BigInt(evidence.phase2.ickbAmount))} iCKB`,
);
const minted = u128le(ickbData);
check(
  "minted amount matches the recorded evidence",
  minted === BigInt(evidence.phase2.ickbAmount),
  `${fmt(minted)} iCKB`,
);
const expected = (depositAmount * 10n ** 16n) / BigInt(evidence.phase1.headerDaoAr);
const delta = minted > expected ? minted - expected : expected - minted;
check(
  "mint equals depositAmount * 1e16 / header AR",
  delta <= 1n,
  `${fmt(minted)} vs ${fmt(expected)} (delta ${delta})`,
);
const ickbCell = await client.getCellLive(evidence.phase2.ickbOutPoint, true);
check(
  "iCKB cell is live",
  ickbCell !== undefined && ickbCell.outputData === ickbData,
);
console.log("");

console.log("4. iCKB type script commits to the deployed Logic code");
const logicCell = await client.getCellLive(config.ickbUdt.logicCode, true);
check(
  "deployed Logic cell data hashes to its code hash",
  ccc.hashCkb(logicCell.outputData) === config.ickbLogic.script.codeHash,
  config.ickbLogic.script.codeHash,
);
const logicHash = ccc.hashCkb(config.ickbLogic.script.toBytes());
const args = ickbOut?.type?.args ?? "";
check(
  "type args start with the live Logic script hash",
  args.startsWith(logicHash),
  `${logicHash}${args.slice(66)}`,
);
check("type args end with owner mode 0x80000000", args.endsWith("00000080"));
console.log("");

console.log("5. Current account view");
const address = await ccc.Address.fromString(evidence.address, client);
const state = await IckbSdk.fromChain("testnet").getL1AccountState(
  client,
  [address.script],
  WALLET_LOCK_UP,
);
const balance = state.account.capacityCells.reduce(
  (sum, cell) => sum + cell.cellOutput.capacity,
  0n,
);
console.log(`  wallet CKB  : ${fmt(balance)} in ${state.account.capacityCells.length} cell(s)`);
console.log(`  iCKB balance: ${fmt(state.account.nativeUdtCells.reduce((sum, cell) => sum + u128le(cell.outputData), 0n))}`);
console.log(`  explorer    : https://pudge.explorer.nervos.org/transaction/${evidence.phase1.txHash}`);
console.log(`  explorer    : https://pudge.explorer.nervos.org/transaction/${evidence.phase2.txHash}`);
console.log("");

const passed = checks.filter((entry) => entry.ok).length;
console.log(`${passed}/${checks.length} checks passed`);
process.exit(passed === checks.length ? 0 : 1);
