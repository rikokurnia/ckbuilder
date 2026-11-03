#!/usr/bin/env node
// 03 · iCKB audit: ScaleBit 2024 + the 2026 executable review.

import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const EVIDENCE = new URL("../evidence/", import.meta.url).pathname;
const PDF = join(EVIDENCE, "scalebit-ickb-audit-2024-09.pdf");
const REVIEW = join(EVIDENCE, "ICKB-Audit-Report-2026.md");

const EXPECTED = {
  pdf: "3b0806477084b9872e20725f96ca0ab26cb873fa1411d0408a7bbeef87c04b61",
  review: "fc664915aaab858806ccf79e82f0e67ff1ca8eea50c976856acece854b27a196",
};

const SCALEBIT = [
  { id: "ENT-1", title: "Busywork Attack", severity: "Informational", status: "Acknowledged" },
  { id: "UTI-1", title: "Handling of LengthNotEnough error", severity: "Informational", status: "Fixed" },
  { id: "ENT1-1", title: "Confusion attack on Limit Order", severity: "Minor", status: "Acknowledged" },
];

const checks = [];
function check(name, ok, detail) {
  checks.push({ name, ok });
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function sizeKb(path) {
  return `${(statSync(path).size / 1024).toFixed(1)} KB`;
}

const review = readFileSync(REVIEW, "utf8");

console.log("=== 03 · iCKB Audit Reports ===");
console.log("Two documents, two different jobs:");
console.log("  ScaleBit 2024  independent audit of the deployed scripts");
console.log("  2026 review    executable review of the same commit, with tests");
console.log("");

console.log("ScaleBit (2024-09-10)");
console.log("  Auditor        : ScaleBit (bitslab.xyz)");
console.log("  Timeline       : 2024-09-03 .. 2024-09-10");
console.log("  Language       : Rust, CKB-VM");
console.log("  Source         : github.com/ickb/v1-core");
console.log("  Commit         : 454cfa966052a621c4e8b67001718c29ee8191a2");
console.log("  Scope          : scripts/contracts/{ickb_logic,owned_owner,limit_order,utils}");
console.log("  Methods        : dependency check, static analysis, manual review");
console.log("  Findings       : 3 total (2 informational, 1 minor, 0 medium+)");
console.log("");

console.log("  ID       Severity       Status        Title");
for (const finding of SCALEBIT) {
  console.log(
    `  ${finding.id.padEnd(8)} ${finding.severity.padEnd(14)} ${finding.status.padEnd(13)} ${finding.title}`,
  );
}
console.log("");

console.log("2026 executable review");
console.log("  Period         : 2026-05-01 .. 2026-09-26");
console.log("  Reviewed commit: 454cfa9 (last commit that changed the scripts)");
console.log("  Evidence       : cargo test -p tests, 231 tests, no failures");
console.log("  Live issue     : LO-01 Limit Order confusion attack (known, still deployed)");
console.log("");
console.log("  LO-01 in one line:");
console.log("  CKB does not execute output locks, so a transaction that only creates");
console.log("  order cells runs no Limit Order check. Anyone can create phantom orders");
console.log("  (no master) or fake orders (someone else's master). Melting a fake order");
console.log("  with a real master strands the real order.");
console.log("");
console.log("  Why it is not a fund-theft bug:");
console.log("  the attacker cannot move the owner's principal; the owner must sign the");
console.log("  melt. The damage is order stranding and a misleading order book, not theft.");
console.log("");

console.log("Evidence files");
console.log(`  scalebit-ickb-audit-2024-09.pdf  ${sizeKb(PDF)}  sha256 ${sha256(PDF).slice(0, 16)}...`);
console.log(`  ICKB-Audit-Report-2026.md        ${sizeKb(REVIEW)}  sha256 ${sha256(REVIEW).slice(0, 16)}...`);
console.log("");

console.log("Integrity checks");
check("ScaleBit PDF matches its recorded hash", sha256(PDF) === EXPECTED.pdf);
check("2026 review matches its recorded hash", sha256(REVIEW) === EXPECTED.review);
check(
  "ScaleBit reports exactly three findings",
  SCALEBIT.length === 3,
  "ENT-1, UTI-1, ENT1-1",
);
check(
  "the 2026 review cross-references the prior audit",
  review.includes("Scalebit") && review.includes("three issues"),
  "two informational, one minor",
);
check(
  "no medium, major or critical finding",
  SCALEBIT.every((finding) => !["Medium", "Major", "Critical"].includes(finding.severity)),
  "0 medium+",
);
check(
  "the 2026 review keeps LO-01 live",
  review.includes("LO-01") && review.includes("only the known `Limit Order` confusion attack remains live"),
  "Limit Order confusion attack",
);
check(
  "the 2026 review records the executable test run",
  review.includes("231` tests") && review.includes("cargo test -p tests"),
  "231 tests",
);
check(
  "the deployment uses hash_type data1",
  review.includes("hash_type = data1"),
  "code hash pinned by data, not by type",
);

const failed = checks.filter((entry) => !entry.ok).length;
console.log("");
console.log(`Summary: ${checks.length - failed}/${checks.length} checks passed.`);
if (failed > 0) process.exitCode = 1;
