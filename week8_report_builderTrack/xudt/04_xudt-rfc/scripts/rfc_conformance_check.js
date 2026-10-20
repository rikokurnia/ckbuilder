import { ccc } from "@ckb-ccc/core";
import fs from "node:fs";
import path from "node:path";
import {
  decodeXudtData,
  explorerTx,
  getXudtType,
  loadState,
  makeClient,
  makeSigner,
  requireState,
} from "../../scripts/common.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const rows = [];
let failures = 0;

function check(id, clause, expected, actual, verdict) {
  if (verdict === "FAIL") failures += 1;
  rows.push({ id, clause, expected, actual, verdict });
  console.log(`${verdict.padEnd(4)} ${id.padEnd(8)} ${clause}`);
  console.log(`     expected: ${expected}`);
  console.log(`     actual:   ${actual}\n`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function hex(bytes) {
  return ccc.hexFrom(bytes);
}

async function lockHashOf(cell) {
  return cell.cellOutput.lock.hash();
}

async function getInputCells(client, tx) {
  return Promise.all(
    tx.inputs.map(async (input) => {
      const live = await client.getCellLive(input.previousOutput, true);
      return live ?? client.getCell(input.previousOutput);
    }),
  );
}

async function main() {
  const client = makeClient();
  const owner = await makeSigner(client);
  const holder = await makeSigner(client, process.env.RECIPIENT_PRIVATE_KEY);
  const state = requireState();
  assert(state.token && state.transfers?.length, "missing live token state");

  const type = await getXudtType(client, state.token.typeArgs);
  const typeHash = await type.hash();
  const args = ccc.bytesFrom(state.token.typeArgs);

  const ownerHash = hex(args.slice(0, 32));
  const flags = new DataView(args.buffer, args.byteOffset + 32, 4).getUint32(0, true);
  const rawExtensions = args.slice(36);
  const scripts = ccc.ScriptVec.decode(rawExtensions);
  const extension = scripts[0];

  const extensionCell = await client.getCellLive(state.extension.outPoint, true);
  assert(extensionCell, "extension code cell is not live");
  const extensionData = ccc.bytesFrom(extensionCell.outputData);
  const extensionHash = ccc.hashCkb(extensionData);

  const mint = await client.getTransaction(state.token.mintTx);
  const transfer = await client.getTransaction(state.transfers.at(-1).txHash);
  assert(mint?.status === "committed", "mint tx is not committed");
  assert(transfer?.status === "committed", "transfer tx is not committed");

  const mintGroup = mint.transaction.outputs
    .map((output, index) => ({ output, index }))
    .filter(({ output }) => output.type?.eq(type));
  const transferGroup = transfer.transaction.outputs
    .map((output, index) => ({ output, index }))
    .filter(({ output }) => output.type?.eq(type));
  const mintInputs = await getInputCells(client, mint.transaction);
  const transferInputs = await getInputCells(client, transfer.transaction);

  const mintHasOwnerInput = (
    await Promise.all(mintInputs.map(lockHashOf))
  ).includes(owner.lockHash);
  const transferHasOwnerInput = (
    await Promise.all(transferInputs.map(lockHashOf))
  ).includes(owner.lockHash);

  const mintAmounts = mintGroup.map(({ output, index }) =>
    decodeXudtData(mint.transaction.outputsData[index]).amount,
  );
  const transferAmounts = transferGroup.map(({ output, index }) =>
    decodeXudtData(transfer.transaction.outputsData[index]).amount,
  );
  const transferLocks = await Promise.all(transferGroup.map(({ output }) => output.lock.hash()));

  console.log("== live artifact ==");
  console.log(`token type hash:   ${typeHash}`);
  console.log(`extension code:    ${state.extension.codeHash} (${state.extension.binaryFile})`);
  console.log(`extension tx:      ${state.extension.deployTx}`);
  console.log(`mint tx:           ${state.token.mintTx}`);
  console.log(`transfer tx:       ${state.transfers.at(-1).txHash}\n`);

  check(
    "RFC-1",
    "Cell data begins with uint128 little-endian amount",
    "2000 / 500 / 1500 decoded from 16-byte prefixes",
    `mint=[${mintAmounts.join(", ")}] transfer=[${transferAmounts.join(", ")}]`,
    mintAmounts.join() === "2000" && transferAmounts.sort((a, b) => Number(a - b)).join() === "500,1500"
      ? "PASS"
      : "FAIL",
  );

  check(
    "RFC-2",
    "type.args = 32-byte owner lock hash + args",
    owner.lockHash,
    ownerHash,
    ownerHash === owner.lockHash ? "PASS" : "FAIL",
  );

  check(
    "RFC-3",
    "flags & 0x1FFFFFFF = 1 selects raw ScriptVec in args",
    "1",
    String(flags & 0x1fffffff),
    (flags & 0x1fffffff) === 1 ? "PASS" : "FAIL",
  );

  check(
    "RFC-4",
    "ScriptVec decodes to one extension script",
    `1 entry, code_hash=${state.extension.codeHash}, hash_type=data1`,
    `${scripts.length} entry, code_hash=${extension.codeHash}, hash_type=${extension.hashType}`,
    scripts.length === 1 &&
      extension.codeHash === state.extension.codeHash &&
      extension.hashType === "data1"
      ? "PASS"
      : "FAIL",
  );

  check(
    "RFC-5",
    "Extension cell data hashes to the data1 code hash",
    state.extension.codeHash,
    extensionHash,
    extensionHash === state.extension.codeHash ? "PASS" : "FAIL",
  );

  check(
    "RFC-6",
    "Owner mode via owner-lock input authorizes issuance",
    `mint has owner input ${owner.lockHash}`,
    `owner input present=${mintHasOwnerInput}, minted=${mintAmounts.join(",")}`,
    mintHasOwnerInput && mintAmounts.join() === "2000" ? "PASS" : "FAIL",
  );

  check(
    "RFC-7",
    "Non-owner transfer preserves supply and invokes extension cap",
    "500 owner + 1500 holder, no owner input",
    `${transferAmounts.join(" + ")}; no owner input=${!transferHasOwnerInput}; locks=${transferLocks.join(", ")}`,
    !transferHasOwnerInput &&
      transferAmounts.sort((a, b) => Number(a - b)).join() === "500,1500" &&
      transferLocks.includes(owner.lockHash) &&
      transferLocks.includes(holder.lockHash)
      ? "PASS"
      : "FAIL",
  );

  const rejection = fs.readFileSync(
    path.join(root, "scripts", "rejection-evidence.txt"),
    "utf8",
  );
  check(
    "RFC-8",
    "1200-unit transfer exceeds cap 1000 and is rejected",
    "CKB error -104",
    rejection.includes("error code -104") ? "error code -104 observed" : "not observed",
    rejection.includes("error code -104") ? "PASS" : "FAIL",
  );

  check(
    "RFC-9",
    "P2SH mode: flags=2, blake160(ScriptVec) in args, ScriptVec in witness",
    "not exercised",
    "only flags=1 raw ScriptVec is implemented in this report",
    "DEFERRED",
  );

  check(
    "RFC-10",
    "Multiple extensions and per-extension XudtData",
    "not exercised",
    "one extension, no XudtData payload",
    "DEFERRED",
  );

  check(
    "RFC-11",
    "owner_script + owner_signature witness path",
    "not exercised",
    "owner mode used an owner-lock input",
    "DEFERRED",
  );

  check(
    "RFC-12",
    "Optional owner-mode bits 0x20000000 / 0x40000000 / 0x80000000",
    "not exercised",
    "flags use only bit 0 (0x1)",
    "DEFERRED",
  );

  check(
    "RFC-13",
    "Mainnet deployment",
    "not exercised",
    "testnet (Pudge) only",
    "DEFERRED",
  );

  const result = {
    checkedAt: new Date().toISOString(),
    network: "testnet",
    tokenTypeHash: typeHash,
    extensionTx: state.extension.deployTx,
    mintTx: state.token.mintTx,
    transferTx: state.transfers.at(-1).txHash,
    mintExplorer: explorerTx(state.token.mintTx),
    transferExplorer: explorerTx(state.transfers.at(-1).txHash),
    rows,
    failures,
  };
  fs.writeFileSync(
    path.join(root, "scripts", "rfc_conformance_result.json"),
    JSON.stringify(result, null, 2) + "\n",
  );

  console.log(`RESULT: ${rows.filter((r) => r.verdict === "PASS").length} pass, ${rows.filter((r) => r.verdict === "DEFERRED").length} deferred, ${failures} fail`);
  if (failures > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
