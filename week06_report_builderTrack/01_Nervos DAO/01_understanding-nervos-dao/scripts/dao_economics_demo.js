import { ccc } from "@ckb-ccc/core";

// ============================================================================
// 01 - UNDERSTANDING NERVOS DAO: economics, issuance, AR compensation model
// Source links:
//  - https://app.blockworks.com/ai/share/understanding-nervos-dao-830c1d00-0afc-47aa-a65c-465701adc67f?from=messari
//  - RFC 0015 cryptoeconomics background, RFC 0023 deposit/withdraw
// ============================================================================

const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574";

const RPC_URL = "https://testnet.ckb.dev/rpc";

function normalizeDao(daoField) {
  if (daoField && typeof daoField === "object" && "ar" in daoField) {
    return {
      C: BigInt(daoField.c),
      AR: BigInt(daoField.ar),
      S: BigInt(daoField.s),
      U: BigInt(daoField.u),
    };
  }
  const bytes = ccc.bytesFrom(daoField, "hex");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u64le = (off) => view.getBigUint64(off, true);
  return {
    C: u64le(0),
    AR: u64le(8),
    S: u64le(16),
    U: u64le(24),
  };
}

async function main() {
  console.log("=================================================================");
  console.log("🟢 WEEK6-01: UNDERSTANDING NERVOS DAO - ECONOMICS & DESIGN");
  console.log("=================================================================\n");

  const client = new ccc.ClientPublicTestnet({ url: RPC_URL });
  const signer = new ccc.SignerCkbPrivateKey(client, PRIVATE_KEY);
  const address = await signer.getRecommendedAddress();
  console.log(`👤 Signer Address: ${address}`);
  console.log(`💰 Balance: ${ccc.fixedPointToString(await signer.getBalance())} CKB\n`);

  const tip = await client.getTipHeader();
  console.log(`📦 Tip Block: #${tip.number.toString()} hash=${tip.hash}`);
  console.log(`   Epoch: integer=${tip.epoch.integer?.toString() ?? tip.epoch} numerator=${tip.epoch.numerator?.toString() ?? "-"} length=${tip.epoch.denominator?.toString() ?? tip.epoch.length?.toString() ?? "-"}`);
  console.log(`   DAO raw: C=${tip.dao.c.toString()} AR=${tip.dao.ar.toString()} S=${tip.dao.s.toString()} U=${tip.dao.u.toString()}`);

  const dao = normalizeDao(tip.dao);
  console.log(`\n📊 DAO header decoded (u64 LE):`);
  console.log(`   C (total issuance incl. block) : ${dao.C.toString()} shannon = ${ccc.fixedPointToString(dao.C)} CKB`);
  console.log(`   AR (accumulated rate x1e16)    : ${dao.AR.toString()} -> ${(Number(dao.AR) / 1e16).toFixed(16)}`);
  console.log(`   S (unissued secondary)         : ${dao.S.toString()} shannon = ${ccc.fixedPointToString(dao.S)} CKB`);
  console.log(`   U (occupied capacities)        : ${dao.U.toString()} shannon = ${ccc.fixedPointToString(dao.U)} CKB`);

  // Compensation intuition: (c_t - c_o) * AR_n / AR_m - (c_t - c_o)
  // Demo with 200 CKB deposit, occupied 102 CKB (standard DAO cell cost)
  const total = ccc.fixedPointFrom(200);
  const occupied = ccc.fixedPointFrom(102);
  const counted = total - occupied;
  console.log(`\n💡 Compensation formula (RFC 0023):`);
  console.log(`   compensation = (c_t - c_o) * AR_n / AR_m - (c_t - c_o)`);
  console.log(`   max_withdraw = (c_t - c_o) * AR_n / AR_m + c_o`);
  console.log(`   Example: c_t=200 CKB, c_o=102 CKB (8 cap + 53 lock + 33 type + 8 data)`);
  console.log(`   counted (profitable) = ${ccc.fixedPointToString(counted)} CKB`);

  // Fetch same AR from 2000 blocks ago to show growth
  try {
    const tipNum = Number(tip.number);
    const pastNum = tipNum > 2000 ? tipNum - 2000 : 0;
    const past = await client.getHeaderByNumber(ccc.numFrom(pastNum));
    if (past) {
      const pastDao = normalizeDao(past.dao);
      console.log(`\n📈 AR growth over last 2000 blocks:`);
      console.log(`   AR @ #${pastNum}: ${(Number(pastDao.AR) / 1e16).toFixed(12)}`);
      console.log(`   AR @ tip       : ${(Number(dao.AR) / 1e16).toFixed(12)}`);
      const profit = (counted * dao.AR) / pastDao.AR - counted;
      console.log(`   Simulated profit for 98 CKB counted over 2000 blocks: ${ccc.fixedPointToString(profit)} CKB`);
      console.log(`   Claim epoch for that window: ${ccc.calcDaoClaimEpoch(past, tip).toString()}`);
    }
  } catch (e) {
    console.log(`   (past header fetch skipped: ${e.message})`);
  }

  console.log(`\n🔑 Key takeaways (Blockworks + RFC 0015/0023):`);
  console.log(`   1. Primary issuance hard-capped (Bitcoin-like halving); secondary constant per epoch.`);
  console.log(`   2. DAO locks get proportional secondary -> inflation shelter, auto-compounding.`);
  console.log(`   3. Min deposit 102 CKB (occupied cost), min lock 180 epochs (~30 days, 1 DAO cycle).`);
  console.log(`   4. Withdraw is 2-phase: deposit(0x00..00) -> withdrawing(block_number LE) -> claim with since.`);
  console.log(`\n🏁 Week6-01 Economics Check Complete!\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Execution Error:", err);
  process.exit(1);
});
