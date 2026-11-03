#!/usr/bin/env node
// 04 · iCKB SDK against testnet: state read, deployment hashes, type script.

import { ccc } from "@ckb-ccc/core";
import { IckbSdk, WALLET_LOCK_UP } from "../../lib/ickb-sdk/index.ts";
import { getConfig } from "../../lib/ickb-sdk/constants.ts";
import { readyDeposits } from "../../lib/ickb-sdk/logic.ts";

const RPC = "https://testnet.ckb.dev/rpc";
const ADDRESS = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwy0rpn3trq0sj2q6arv7xaq9w6m6xa0egxe8xvr";
const DEP_GROUP = {
  txHash: "0xf7ece4fb33d8378344cab11fcd6a4c6f382fd4207ac921cf5821f30712dcd311",
  index: 0,
};
const OWNER_MODE = "80000000";

const CKB = 100_000_000n;
const checks = [];
function check(name, ok, detail) {
  checks.push({ name, ok });
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
}

function fmt(shannons) {
  const value = shannons < 0n ? -shannons : shannons;
  const whole = value / CKB;
  let fraction = (value % CKB).toString().padStart(8, "0").replace(/0+$/, "");
  return `${shannons < 0n ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

function ratioPerIckb({ ckbScale, udtScale }) {
  return fmt((udtScale * CKB) / ckbScale);
}

// Raw outpoint list: count(4, LE) + count * 36 bytes (32-byte hash + 4-byte index).
function countDepGroup(dataHex) {
  const bytes = (dataHex.length - 2) / 2;
  const countHex = dataHex.slice(2, 10).match(/../g).reverse().join("");
  const count = Number(BigInt("0x" + countHex));
  const expected = 4 + count * 36;
  return { count, bytes, valid: bytes === expected };
}

console.log("=== 04 · iCKB SDK on Testnet ===");
console.log(`RPC      : ${RPC}`);
console.log(`Wallet   : ${ADDRESS}`);
console.log("");

const client = new ccc.ClientPublicTestnet({ url: RPC });
const config = getConfig("testnet");
const sdk = IckbSdk.fromChain("testnet");

console.log("1. Sampled chain state");
const started = Date.now();
const address = await ccc.Address.fromString(ADDRESS, client);
const state = await sdk.getL1AccountState(client, [address.script], WALLET_LOCK_UP);
const tip = state.system.tip;
console.log(`  tip            : #${tip.number}`);
console.log(`  DAO AR         : ${tip.dao.ar}`);
console.log(`  fee rate       : ${state.system.feeRate} shannons/KB`);
console.log(`  1 iCKB         : ${ratioPerIckb(state.system.exchangeRatio)} CKB`);
console.log(`  read time      : ${((Date.now() - started) / 1000).toFixed(1)} s (tip + pool + orders + wallet)`);
console.log("");

console.log("2. Deployment code cells (live, hash_type data1)");
const udtCell = await client.getCellLive(config.ickbUdt.udtCode, true);
const logicCell = await client.getCellLive(config.ickbUdt.logicCode, true);
const udtHash = ccc.hashCkb(udtCell.outputData);
const logicHash = ccc.hashCkb(logicCell.outputData);
console.log(`  xUDT code      : ${udtHash}`);
console.log(`    expected     : ${config.ickbUdt.script.codeHash}  ${udtHash === config.ickbUdt.script.codeHash ? "MATCH" : "MISMATCH"}`);
console.log(`  iCKB Logic     : ${logicHash}`);
console.log(`    expected     : ${config.ickbLogic.script.codeHash}  ${logicHash === config.ickbLogic.script.codeHash ? "MATCH" : "MISMATCH"}`);
console.log("  The hashes are computed from the live cell data, not read from constants.");
console.log("");

console.log("3. Dependency group");
const groupCell = await client.getCellLive(DEP_GROUP, true);
const group = countDepGroup(groupCell.outputData);
console.log(`  cell           : ${DEP_GROUP.txHash}:${DEP_GROUP.index}`);
console.log(`  members        : ${group.count}`);
console.log(`  encoded bytes  : ${group.bytes} (expected ${4 + group.count * 36})`);
console.log("");

console.log("4. iCKB type script");
const typeArgs = config.ickbUdt.script.args;
const logicScriptHash = ccc.hashCkb(config.ickbLogic.script.toBytes());
console.log(`  codeHash       : ${config.ickbUdt.script.codeHash}`);
console.log(`  hashType       : ${config.ickbUdt.script.hashType}`);
console.log(`  args           : ${typeArgs}`);
console.log(`  logic code hash: ${config.ickbLogic.script.codeHash}`);
console.log(`  logic script   : ${logicScriptHash}`);
console.log(`  owner mode     : 0x${typeArgs.slice(66)} (little-endian 0x80000000)`);
console.log("  The args commit to the logic *script* hash, not to its code hash.");
console.log("  Owners sign for their own iCKB; the mode suffix is part of the type args.");
console.log("");

console.log("5. Account and pool");
const ckbCells = state.account.capacityCells;
const ckbTotal = ckbCells.reduce((sum, cell) => sum + cell.cellOutput.capacity, 0n);
const ickbTotal = state.account.nativeUdtCells.reduce(
  (sum, cell) => sum + ccc.udtBalanceFrom(cell.outputData),
  0n,
);
const ready = readyDeposits(state.system.poolDeposits, tip, WALLET_LOCK_UP);
console.log(`  plain CKB cells: ${ckbCells.length}, total ${fmt(ckbTotal)} CKB`);
console.log(`  iCKB cells     : ${state.account.nativeUdtCells.length}, total ${fmt(ickbTotal)} iCKB`);
console.log(`  receipts       : ${state.account.receipts.length}`);
console.log(`  withdrawals    : ${state.account.withdrawalGroups.length}`);
console.log(`  pool deposits  : ${state.system.poolDeposits.length}, ready now ${ready.length}`);
console.log(`  order book     : ${state.system.orderPool.length} orders past par`);
console.log("  Ready deposits can fill a withdrawal immediately; zero means wait for maturity.");
console.log("");

console.log("6. Checks");
check("xUDT code cell hashes to the configured code hash", udtHash === config.ickbUdt.script.codeHash);
check("iCKB Logic code cell hashes to the configured code hash", logicHash === config.ickbLogic.script.codeHash);
check("the dependency group decodes to eight outpoints", group.valid && group.count === 8, `${group.count} members`);
check("the iCKB type args embed the logic script hash", typeArgs.slice(2, 66) === logicScriptHash.slice(2));
check("the iCKB type args carry owner mode 0x80000000", typeArgs.endsWith("00000080"), "0x00000080 little-endian");
check("the exchange ratio is above par", state.system.exchangeRatio.udtScale > state.system.exchangeRatio.ckbScale,
  `1 iCKB = ${ratioPerIckb(state.system.exchangeRatio)} CKB`);
check("the SDK read the wallet's plain CKB cells", ckbCells.length > 0, `${fmt(ckbTotal)} CKB`);
check("the testnet pool is not empty", state.system.poolDeposits.length > 0, `${state.system.poolDeposits.length} deposits`);

const failed = checks.filter((entry) => !entry.ok).length;
console.log("");
console.log(`Summary: ${checks.length - failed}/${checks.length} checks passed.`);
console.log("Read-only: no key is loaded, no transaction is signed or sent.");
if (failed > 0) process.exitCode = 1;
