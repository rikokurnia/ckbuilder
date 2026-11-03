import { ccc } from "@ckb-ccc/core";

// ============================================================================
// 01 - SSRI METHOD PATH: argv[0] dispatch (Nervos Talk #8256, post #2 by saku)
// method_path(sig) = first 8 bytes of CKB-Blake2b("[<trait>.]<method>")
// Known vector (ssri-server README): SSRI.get_methods = 0x58f02409de9de7b1
// ============================================================================

const RPC_URL = "https://testnet.ckb.dev/rpc";

function methodPath(signature) {
  // hashCkb returns 0x-hex string; first 8 bytes = "0x" + 16 hex chars
  return ccc.hashCkb(new TextEncoder().encode(signature)).slice(0, 18);
}

async function main() {
  console.log("=================================================================");
  console.log("🟢 WEEK7-01: SSRI METHOD PATH - argv[0] DISPATCH VERIFICATION");
  console.log("=================================================================\n");

  const vectors = [
    ["SSRI.get_methods", "0x58f02409de9de7b1"], // from ssri-server README
    ["SSRI.version", null],
    ["SSRI.has_methods", null],
    ["SSRI.get_cell_deps", null],
    ["UDT.symbol", null],
    ["UDT.decimals", null],
    ["UDT.name", null],
    ["UDTPausable.is_paused", null],
    ["UDTPausable.enumerate_paused", null],
  ];

  console.log("Signature -> method_path (u64 LE hex) | check");
  let allOk = true;
  for (const [sig, expected] of vectors) {
    const got = methodPath(sig);
    const mark = expected ? (got === expected ? "✅ MATCH" : "❌ MISMATCH") : "(computed)";
    if (expected && got !== expected) allOk = false;
    console.log(`  ${sig.padEnd(28)} ${got}  ${mark}`);
  }

  // argv layout demo: [method_path, ...method_args] as LE u64 + params
  console.log(`\n💡 Dispatch rule (Talk #8256):`);
  console.log(`   - argv[0] = 8-byte method path; rest = method params`);
  console.log(`   - No method path  -> run original verifier logic`);
  console.log(`   - Bad length/unknown -> exit non-zero error code`);
  console.log(`   - No overloads: type params do not affect path`);

  // Liveness: show PUDT testnet type script that implements these methods
  const client = new ccc.ClientPublicTestnet({ url: RPC_URL });
  const tip = await client.getTipHeader();
  console.log(`\n📦 Pudge tip #${tip.number.toString()} (RPC reachable)`);
  console.log(`   PUDT testnet type: code_hash=0x3f6b5156...0b48c9 (from ckb_ssri_cli defaults)`);
  console.log(`   Methods above are callable off-chain on that script via ssri-server (module 04).`);

  console.log(`\n${allOk ? "✅" : "❌"} Known-vector check ${allOk ? "PASSED" : "FAILED"}`);
  console.log(`🏁 Week7-01 Method Path Check Complete!\n`);
  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error("❌ Execution Error:", err);
  process.exit(1);
});
