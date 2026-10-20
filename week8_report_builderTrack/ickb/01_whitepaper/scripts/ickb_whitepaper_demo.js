#!/usr/bin/env node
// 01 · iCKB whitepaper mechanics, offline.
// No network access: the exchange ratio is a labelled snapshot from testnet.

const CKB = 100_000_000n; // 1 CKB in shannons
const AR0 = 10_000_000_000_000_000n; // genesis accumulated rate, 1e16
const STANDARD_ICKB = 100_000n * CKB; // 100,000 iCKB
const OCCUPIED = 82n * CKB; // occupied capacity of an iCKB cell
const MIN_FREE = 1_000n * CKB;
const MAX_FREE = 1_000_000n * CKB;
const FEE_BPS = 1_000n; // 10% on the amount above the standard deposit
const BPS = 10_000n;

// Snapshot read from testnet at tip 22,803,925 (2026-10-20).
const AR_M = 11_944_788_765_246_529n;
const SNAPSHOT_TIP = 22_803_925;

const checks = [];
function check(name, ok, detail) {
  checks.push({ name, ok, detail });
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
}

function fmt(shannons, decimals = 8) {
  const negative = shannons < 0n;
  const value = negative ? -shannons : shannons;
  const unit = 10n ** BigInt(decimals);
  const whole = value / unit;
  let fraction = (value % unit).toString().padStart(decimals, "0");
  fraction = fraction.replace(/0+$/, "");
  const text = fraction ? `${whole}.${fraction}` : `${whole}`;
  return negative ? `-${text}` : text;
}

function ickbForFreeCkb(freeCkb, ar) {
  const gross = (freeCkb * AR0) / ar;
  if (gross <= STANDARD_ICKB) return { gross, fee: 0n, net: gross };
  const excess = gross - STANDARD_ICKB;
  const fee = (excess * FEE_BPS) / BPS;
  return { gross, fee, net: gross - fee };
}

function ckbForIckb(ickb, ar) {
  return (ickb * ar) / AR0;
}

function daoClaim(capacity, arOpen, arClose) {
  const free = capacity - OCCUPIED;
  return (free * arClose) / arOpen + OCCUPIED;
}

console.log("=== 01 · iCKB Whitepaper Mechanics ===");
console.log("Model: offline. Exchange ratio is a labelled testnet snapshot.");
console.log(`Snapshot tip: #${SNAPSHOT_TIP}, AR_m = ${AR_M}`);
console.log("");

console.log("1. Genesis parameters");
console.log(`  AR_0 (genesis)           : ${AR0}`);
console.log(`  Standard deposit         : 100,000 iCKB`);
console.log(`  Occupied capacity        : ${fmt(OCCUPIED)} CKB`);
console.log(`  Free CKB range           : ${fmt(MIN_FREE)} .. ${fmt(MAX_FREE)} CKB`);
console.log(`  Min total capacity       : ${fmt(MIN_FREE + OCCUPIED)} CKB`);
console.log("");

console.log("2. Exchange rate at the snapshot");
const ckbPerIckb = (AR_M * CKB) / AR0; // shannons of CKB per 1 iCKB
const ickbPerCkb = (AR0 * CKB) / AR_M; // shannons of iCKB per 1 CKB
console.log(`  1 iCKB = ${fmt(ckbPerIckb)} CKB`);
console.log(`  1 CKB  = ${fmt(ickbPerCkb)} iCKB`);
console.log(`  AR grows with DAO secondary issuance, so 1 iCKB is worth more CKB over time.`);
console.log("");

console.log("3. Deposit -> receipt -> iCKB (phase 1 + phase 2)");
const capacity = 1_082n * CKB;
const free = capacity - OCCUPIED;
const { gross, fee, net } = ickbForFreeCkb(free, AR_M);
console.log(`  Input capacity           : ${fmt(capacity)} CKB`);
console.log(`  Free capacity (deposit)  : ${fmt(free)} CKB`);
console.log(`  Receipt data             : quantity=1, deposit_amount=${free}`);
console.log(`  Phase 2 gross iCKB       : ${fmt(gross)} iCKB`);
console.log(`  Phase 2 fee              : ${fmt(fee)} iCKB`);
console.log(`  Phase 2 minted iCKB      : ${fmt(net)} iCKB`);
console.log("");

console.log("4. Withdrawal after 180 epochs (simulated AR +2%)");
const AR_N = (AR_M * 102n) / 100n;
const returnedFree = ckbForIckb(net, AR_N);
const returnedTotal = returnedFree + OCCUPIED;
const profit = returnedTotal - capacity;
console.log(`  AR_n                     : ${AR_N} (+2%)`);
console.log(`  DAO claim formula        : (c_t - c_o) * AR_n / AR_m + c_o`);
console.log(`  Free CKB returned        : ${fmt(returnedFree)} CKB`);
console.log(`  Total capacity returned  : ${fmt(returnedTotal)} CKB`);
console.log(`  Profit                   : ${fmt(profit)} CKB`);
console.log("");

console.log("5. Oversized deposit (fee on the portion above 100,000 iCKB)");
const bigFree = 150_000n * CKB;
const big = ickbForFreeCkb(bigFree, AR_M);
console.log(`  Free capacity            : ${fmt(bigFree)} CKB`);
console.log(`  Gross iCKB               : ${fmt(big.gross)} iCKB`);
console.log(`  Above standard           : ${fmt(big.gross - STANDARD_ICKB)} iCKB`);
console.log(`  10% fee                  : ${fmt(big.fee)} iCKB`);
console.log(`  Net iCKB                 : ${fmt(big.net)} iCKB`);
console.log("");

console.log("6. Invariants");
check("exchange rate is above 1 CKB per iCKB", ckbPerIckb > CKB, `1 iCKB = ${fmt(ckbPerIckb)} CKB`);
check(
  "minimum deposit is 1,082 CKB total",
  MIN_FREE + OCCUPIED === capacity,
  `${fmt(MIN_FREE)} free + ${fmt(OCCUPIED)} occupied`,
);
const roundTrip = ckbForIckb(net, AR_M) + OCCUPIED;
const roundTripDiff = roundTrip > capacity ? roundTrip - capacity : capacity - roundTrip;
check(
  "same-rate round trip returns the input capacity",
  roundTripDiff <= 1n,
  `diff ${roundTripDiff} shannon(s)`,
);
check(
  "oversized deposit pays the 10% fee only above the cap",
  big.fee === ((big.gross - STANDARD_ICKB) * FEE_BPS) / BPS && big.fee > 0n,
  `fee ${fmt(big.fee)} iCKB`,
);
check(
  "withdrawal at a higher AR returns more CKB",
  returnedTotal > capacity,
  `+${fmt(profit)} CKB over 180 epochs`,
);
check(
  "receipt amount is the free capacity, not the total capacity",
  free === capacity - OCCUPIED,
  `${fmt(free)} CKB`,
);

const failed = checks.filter((entry) => !entry.ok).length;
console.log("");
console.log(`Summary: ${checks.length - failed}/${checks.length} checks passed.`);
if (failed > 0) process.exitCode = 1;
