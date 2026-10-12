import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// ============================================================================
// 05 - ckb-ssri-std SOURCE INVENTORY (docs.rs companion, offline-verifiable)
// Reads vendored crate source (== docs.rs 0.0.1 content) and maps the API:
// SSRIError, UDT/UDTPausable traits, off-chain syscalls, encoding helpers.
// Vendor: 05_sdk-docs/vendor/ckb-ssri-std-0.0.1/ (sha256 3ce0963e...6c63580)
// ============================================================================

const SRC = new URL("../vendor/ckb-ssri-std-0.0.1/src/", import.meta.url).pathname;

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (f.endsWith(".rs")) out.push(p);
  }
  return out;
}

function grepPubTraitBodies(text) {
  // naive: capture "pub trait X" + "pub enum X" + "pub fn name(" lines
  const traits = [...text.matchAll(/pub trait (\w+)/g)].map((m) => m[1]);
  const enums = [...text.matchAll(/pub enum (\w+)/g)].map((m) => m[1]);
  const structs = [...text.matchAll(/pub struct (\w+)/g)].map((m) => m[1]);
  const fns = [...text.matchAll(/pub fn (\w+)\(/g)].map((m) => m[1]);
  const consts = [...text.matchAll(/pub const (\w+)/g)].map((m) => m[1]);
  return { traits, enums, structs, fns, consts };
}

async function main() {
  console.log("=================================================================");
  console.log("🟢 WEEK7-05: ckb-ssri-std API MAP (vendored source = docs.rs 0.0.1)");
  console.log("=================================================================\n");

  const files = walk(SRC);
  console.log(`📂 ${files.length} Rust source files vendored:`);
  for (const f of files) {
    const rel = f.replace(SRC, "src/");
    const n = readFileSync(f, "utf8").split("\n").length;
    console.log(`   - ${rel} (${n} lines)`);
  }

  console.log(`\n🧬 Public API per file (code only, doc-comments excluded):`);
  for (const f of files) {
    const code = readFileSync(f, "utf8")
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("//"))
      .join("\n");
    const api = grepPubTraitBodies(code);
    const parts = [];
    if (api.traits.length) parts.push(`traits=[${api.traits}]`);
    if (api.enums.length) parts.push(`enums=[${api.enums}]`);
    if (api.structs.length) parts.push(`structs=[${api.structs}]`);
    if (api.consts.length) parts.push(`consts=[${api.consts}]`);
    if (api.fns.length) parts.push(`fns=[${api.fns}]`);
    console.log(`   ${f.replace(SRC, "src/")}: ${parts.join(" ") || "(re-exports/docs)"}`);
  }

  console.log(`\n💡 Encoding rules (Talk #8256 SSRI trait section):`);
  console.log(`   - ints LE, bool 1 byte, strings utf-8 as molecule vector<byte>, composites molecule`);
  console.log(`   - prelude helpers: encode/decode_u64_vector, encode/decode_u8_32_vector`);
  console.log(`   - off-chain syscalls: SYS_FIND_OUT_POINT_BY_TYPE=2277, BY_OUT_POINT=2287, DATA=2297`);
  console.log(`   - fallback: should_fallback() -> no argv[0] means run verifier logic`);
  console.log(`   - simulator module is feature-gated (native-simulator), not in default build`);

  console.log(`\n🏁 Week7-05 API Map Complete!\n`);
}

main().catch((err) => {
  console.error("❌ Execution Error:", err);
  process.exit(1);
});
