import { ccc } from "@ckb-ccc/core";

// ============================================================================
// 02 - ckb-ssri-std ON crates.io: registry inventory (live API)
// Crate: https://crates.io/crates/ckb-ssri-std (v0.0.1, by Hanssen0)
// ============================================================================

const UA = { "User-Agent": "ckbuilder-report/1.0 (research)" };

async function get(path) {
  const res = await fetch(`https://crates.io/api/v1${path}`, { headers: UA });
  if (!res.ok) throw new Error(`API ${path} -> HTTP ${res.status}`);
  return res.json();
}

async function main() {
  console.log("=================================================================");
  console.log("🟢 WEEK7-02: ckb-ssri-std CRATE INVENTORY (crates.io LIVE API)");
  console.log("=================================================================\n");

  const meta = await get("/crates/ckb-ssri-std");
  const c = meta.crate;
  console.log(`📦 Crate: ${c.name} (id ${c.id})`);
  console.log(`   Description : ${c.description}`);
  console.log(`   Latest      : ${c.max_version} (only ${c.num_versions} version)`);
  console.log(`   License     : MIT | Edition 2021 | Downloads: ${c.downloads} (recent ${c.recent_downloads})`);
  console.log(`   Created     : ${c.created_at}`);
  console.log(`   Repo        : ${c.repository}`);
  console.log(`   Docs        : ${c.documentation}`);
  console.log(`   Keywords    : ${(meta.keywords || []).map((k) => k.keyword).join(", ")}`);

  const vers = await get("/crates/ckb-ssri-std/0.0.1/dependencies");
  console.log(`\n🔗 Dependencies of v0.0.1:`);
  for (const d of vers.dependencies || []) {
    console.log(`   - ${d.crate_id} ${d.req} (kind=${d.kind}${d.optional ? ", optional" : ""}${d.default_features ? ", default-features" : ", no-default"})`);
  }

  const dl = `https://static.crates.io/crates/ckb-ssri-std/ckb-ssri-std-0.0.1.crate`;
  const head = await fetch(dl, { method: "HEAD", headers: UA });
  console.log(`\n📥 Tarball: ${dl}`);
  console.log(`   HTTP ${head.status}, ${head.headers.get("content-length")} bytes (expect 8707)`);

  // Checksum anchor (from API version record)
  const v = (meta.versions || []).find((x) => x.num === "0.0.1");
  console.log(`   sha256: ${v?.checksum}`);
  console.log(`   Source vendored for module 05 at: 05_sdk-docs/vendor/ckb-ssri-std-0.0.1/`);

  console.log(`\n🔑 Takeaways:`);
  console.log(`   1. Single 0.0.1 release (2025-01-10) by Hanssen0 = ssri-test author.`);
  console.log(`   2. Deps: ckb-std 0.16.4 (allocator+ckb-types), serde+serde_molecule (no_std), proc-macro.`);
  console.log(`   3. no_std-first: built for CKB-VM contracts, not servers.`);
  console.log(`\n🏁 Week7-02 Crate Inventory Complete!\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Execution Error:", err);
  process.exit(1);
});
