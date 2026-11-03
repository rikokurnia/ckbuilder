// Prints the TESTNET faucet address for an fnn node's funding lock.
// Usage:
//   fnn-cli -u http://127.0.0.1:8227 info node_info -o json | node docs/fnn-addr.mjs
// Reads node_info JSON from stdin, extracts default_funding_lock_script,
// derives the ckt... address, verifies it parses back, then prints it.
// TESTNET ONLY. Never use with mainnet scripts.
import * as ccc from "../frontend/node_modules/@ckb-ccc/core/dist/barrel.mjs";

let input = "";
for await (const chunk of process.stdin) input += chunk;
const info = JSON.parse(input);
const result = info.result ?? info;
const lock = result.default_funding_lock_script;
if (!lock?.code_hash || !lock?.hash_type || lock?.args == null) {
  console.error("Could not find default_funding_lock_script in node_info output.");
  process.exit(1);
}
const script = new ccc.Script(lock.code_hash, lock.hash_type, lock.args);
const { ClientPublicTestnet, Address } = ccc;
const addr = await Address.fromScript(script, new ClientPublicTestnet());
const back = await Address.fromString(addr.toString(), new ClientPublicTestnet());
if (back.script.toString() !== script.toString()) {
  console.error("Round-trip verification FAILED, refusing to print address.");
  process.exit(1);
}
if (!addr.toString().startsWith("ckt")) {
  console.error("Derived address is not testnet (ckt...), refusing to print.");
  process.exit(1);
}
console.log(addr.toString());
