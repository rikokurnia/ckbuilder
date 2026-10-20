import { ccc } from "@ckb-ccc/core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const RPC_URL = process.env.RPC_URL || "https://testnet.ckb.dev/rpc";
export const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574";
export const RECIPIENT_PRIVATE_KEY =
  process.env.RECIPIENT_PRIVATE_KEY ||
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

export const CAP = 1000n;
export const ISSUE_AMOUNT = 2000n;
export const SEND_OK = 500n;
export const SEND_REJECT = 1200n;
export const TOKEN_CELL_CAPACITY = 640n;
export const TOKEN_OUTPUT_CAPACITY = 320n;
export const RECIPIENT_FUNDING = 1000n;
export const EXTENSION_FLAGS = 1;
export const SHANNONS_PER_CKB = 100000000n;

export function ckbToShannons(n) {
  return BigInt(n) * SHANNONS_PER_CKB;
}

export const XUDT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const STATE_PATH = path.join(
  XUDT_ROOT,
  "03_programmability",
  "scripts",
  "deployment.testnet.json",
);

export function makeClient() {
  return new ccc.ClientPublicTestnet({ url: RPC_URL });
}

export async function makeSigner(client, privateKey = PRIVATE_KEY) {
  const signer = new ccc.SignerCkbPrivateKey(client, privateKey);
  const address = await signer.getRecommendedAddress();
  const { script: lock } = await ccc.Address.fromString(address, client);
  return { signer, address, lock, lockHash: await lock.hash() };
}

export function u128LE(n) {
  if (n < 0n || n > (1n << 128n) - 1n) {
    throw new Error(`u128 out of range: ${n}`);
  }
  const buf = Buffer.alloc(16);
  buf.writeBigUInt64LE(n & 0xffffffffffffffffn, 0);
  buf.writeBigUInt64LE((n >> 64n) & 0xffffffffffffffffn, 8);
  return "0x" + buf.toString("hex");
}

export function readU128LE(bytes) {
  if (bytes.length < 16) {
    throw new Error(`expected at least 16 bytes, got ${bytes.length}`);
  }
  let value = 0n;
  for (let i = 15; i >= 0; i--) {
    value = (value << 8n) | BigInt(bytes[i]);
  }
  return value;
}

export function decodeXudtData(hex) {
  const bytes = ccc.bytesFrom(hex);
  if (bytes.length < 16) {
    throw new Error(`xUDT data is ${bytes.length} bytes, expected >= 16`);
  }
  return {
    amount: readU128LE(bytes.subarray(0, 16)),
    extraData: ccc.hexFrom(bytes.subarray(16)),
    dataLength: bytes.length,
  };
}

export function encodeExtensionArgs({ ownerLockHash, cap, extensionScripts }) {
  const flagBytes = Buffer.alloc(4);
  flagBytes.writeUInt32LE(EXTENSION_FLAGS, 0);
  const scripts = extensionScripts.map((s) =>
    s instanceof ccc.Script ? s : ccc.Script.from(s),
  );
  const scriptVec = ccc.ScriptVec.encode(scripts);
  const combined = Buffer.concat([
    Buffer.from(ccc.bytesFrom(ownerLockHash)),
    flagBytes,
    Buffer.from(scriptVec),
  ]);
  return "0x" + combined.toString("hex");
}

export async function getKnownXudt(client) {
  return client.getKnownScript(ccc.KnownScript.XUdt);
}

export async function getXudtType(client, typeArgs) {
  const known = await getKnownXudt(client);
  return ccc.Script.from({
    codeHash: known.codeHash,
    hashType: known.hashType,
    args: typeArgs,
  });
}

export function loadState() {
  if (!fs.existsSync(STATE_PATH)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
}

export function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
}

export function requireState() {
  const state = loadState();
  if (!state) {
    throw new Error(
      `missing ${path.relative(process.cwd(), STATE_PATH)}; run deploy_extension.mjs and issue_xudt.mjs first`,
    );
  }
  return state;
}

export async function findTokenCells(client, type, limit = 20) {
  const cells = [];
  for await (const cell of client.findCellsByType(type, true, "asc", limit)) {
    cells.push(cell);
  }
  return cells;
}

export async function rpc(method, params) {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: 1, jsonrpc: "2.0", method, params }),
  });
  const body = await res.json();
  if (body.error) {
    throw new Error(`${method}: ${JSON.stringify(body.error)}`);
  }
  return body.result;
}

export async function waitCommitted(txHash, { attempts = 40, delayMs = 4000 } = {}) {
  let last = null;
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, delayMs));
    const result = await rpc("get_transaction", [txHash]);
    last = result?.tx_status || null;
    if (last?.status === "committed") {
      return {
        status: last.status,
        blockNumber: parseInt(last.block_number, 16),
        blockHash: last.block_hash,
      };
    }
    if (last?.status === "rejected") {
      throw new Error(`transaction rejected: ${JSON.stringify(last)}`);
    }
    process.stdout.write(".");
  }
  return last;
}

export function explorerTx(txHash) {
  return `https://pudge.explorer.nervos.org/transaction/${txHash}`;
}

export function explorerAddress(address) {
  return `https://pudge.explorer.nervos.org/address/${address}`;
}
