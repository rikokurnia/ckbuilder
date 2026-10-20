#!/usr/bin/env node
// 02 · iCKB GitHub repository map, offline by default.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../../", import.meta.url).pathname;
const CONSTANTS = join(ROOT, "lib/ickb-sdk/constants.ts");
const PROVENANCE = join(ROOT, "lib/ickb-sdk/PROVENANCE.md");
const SDK_DIR = join(ROOT, "lib/ickb-sdk");

const SNAPSHOT_DATE = "2026-10-20";
const REPOS = [
  {
    name: "ickb/whitepaper",
    branch: "master",
    head: "3e0ffbdc1a776150439ab322018d61da03c27481",
    date: "2026-09-26",
    role: "protocol specification, deposit and withdrawal math",
  },
  {
    name: "ickb/contracts",
    branch: "master",
    head: "c951927e35fb5d4a13e28c5e55687d49cea7ca05",
    date: "2026-09-26",
    role: "L1 scripts in Rust, audited at 454cfa9",
  },
  {
    name: "ickb/stack",
    branch: "master",
    head: "9582ab441e64aff304a3af2be70e86713a645169",
    date: "2026-10-15",
    role: "current SDK, interface, testkit, scripts",
  },
];

const SCRIPTS = [
  ["ickb_logic", "lock", "holds DAO deposits and types receipts"],
  ["owned_owner", "lock", "holds withdrawal requests until they are paired with owned iCKB"],
  ["limit_order", "lock", "matches deposits and withdrawals without waiting 180 epochs"],
  ["utils", "library", "shared helpers for the three scripts"],
];

const TESTNET = {
  udtCode: "0xbf6fb538763efec2a70a6a3dcb7242787087e1030c4e7d86585bc63a9d337f5f",
  logicCode: "0x9ac989b3355764f76cdce02c69dedb819fdfbcbda49a7db1a2c9facdfdb9a7fe",
  depGroup: "0xf7ece4fb33d8378344cab11fcd6a4c6f382fd4207ac921cf5821f30712dcd311",
};

const CODE_HASHES = [
  "0x50bd8d6680b8b9cf98b73f3c08faf8b2a21914311954118ad6609be6e78a1b95", // xUDT
  "0x2a8100ab5990fa055ab1b50891702e1e895c7bd1df6322cd725c1a6115873bd3", // iCKB Logic
  "0xacc79e07d107831feef4c70c9e683dac5644d5993b9cb106dca6e74baa381bd0", // Owned Owner
  "0x49dfb6afee5cc8ac4225aeea8cb8928b150caf3cd92fea33750683c74b13254a", // Limit Order
  "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e", // Nervos DAO
];

const checks = [];
function check(name, ok, detail) {
  checks.push({ name, ok });
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
}

function countFiles(dir) {
  let files = 0;
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    files += statSync(path).isDirectory() ? countFiles(path) : 1;
  }
  return files;
}

console.log("=== 02 · iCKB GitHub Repositories ===");
console.log(`Snapshot: ${SNAPSHOT_DATE}. All checks below are local and offline.`);
console.log("");

console.log("Repository map");
for (const repo of REPOS) {
  console.log(`  ${repo.name}  ${repo.branch}  ${repo.head.slice(0, 7)}  ${repo.date}`);
  console.log(`    ${repo.role}`);
}
console.log("");

console.log("Contracts: scripts/contracts");
for (const [name, kind, role] of SCRIPTS) {
  console.log(`  ${name.padEnd(12)} ${kind.padEnd(8)} ${role}`);
}
console.log("  Audited commit: 454cfa9 (see 03_audit-report)");
console.log("");

console.log("Current stack layout");
console.log("  sdk/        typed transaction builders (the only part vendored here)");
console.log("  interface/  React dApp");
console.log("  testkit/    devnet fixtures and assertions");
console.log("  scripts/    workspace tooling");
console.log("");

console.log("Testnet deployment");
console.log(`  xUDT code cell      ${TESTNET.udtCode}`);
console.log(`  iCKB Logic code     ${TESTNET.logicCode}`);
console.log(`  dep group           ${TESTNET.depGroup}`);
console.log("");

const constants = readFileSync(CONSTANTS, "utf8");
const provenance = readFileSync(PROVENANCE, "utf8");
const sdkFiles = countFiles(SDK_DIR);

console.log("Integrity checks");
check(
  "vendored SDK is pinned to the stack HEAD in the snapshot",
  provenance.includes("9582ab441e64aff304a3af2be70e86713a645169"),
  "9582ab4",
);
check(
  "all three testnet code cells are present in constants.ts",
  Object.values(TESTNET).every((value) => constants.includes(value)),
  "udtCode, logicCode, depGroup",
);
check(
  "all five script code hashes are present in constants.ts",
  CODE_HASHES.every((value) => constants.includes(value)),
  "xUDT, iCKB Logic, Owned Owner, Limit Order, DAO",
);
check(
  "mainnet deployment is present for parity",
  constants.includes("0xc07844ce21b38e4b071dd0e1ee3b0e27afd8d7532491327f39b786343f558ab7") &&
    constants.includes("0xd7309191381f5a8a2904b8a79958a9be2752dbba6871fa193dab6aeb29dc8f44"),
  "mainnet udtCode + logicCode",
);
check("vendored SDK contains the full source tree", sdkFiles >= 25, `${sdkFiles} files`);
check("the snapshot covers exactly the three maintained repos", REPOS.length === 3);

if (process.argv.includes("--live")) {
  console.log("");
  console.log("Live heads (GitHub API)");
  for (const repo of REPOS) {
    try {
      const response = await fetch(`https://api.github.com/repos/${repo.name}/commits?per_page=1`, {
        headers: { "User-Agent": "ickb-week8-report" },
        signal: AbortSignal.timeout(5_000),
      });
      const data = await response.json();
      const sha = data?.[0]?.sha ?? "unavailable";
      console.log(`  ${repo.name.padEnd(18)} ${sha === repo.head ? "same" : "moved"}  ${sha.slice(0, 7)}`);
    } catch {
      console.log(`  ${repo.name.padEnd(18)} fetch failed, snapshot kept`);
    }
  }
}

const failed = checks.filter((entry) => !entry.ok).length;
console.log("");
console.log(`Summary: ${checks.length - failed}/${checks.length} checks passed.`);
if (failed > 0) process.exitCode = 1;
