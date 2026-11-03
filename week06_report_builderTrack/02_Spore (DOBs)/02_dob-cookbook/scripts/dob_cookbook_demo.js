/**
 * 02 - DOB Cookbook Demo (OFFLINE)
 * Covers: https://github.com/sporeprotocol/dob-cookbook + https://docs.spore.pro/dob/dob-cookbook
 * - DOB/0 vs DOB/1 protocol family
 * - Storage integration patterns (regular-link, IPFS, BTCFS)
 * - Trait composition (DNA -> visual) simulation
 * - Compatibility matrix (JoyID, Omiga, Explorer, Mobit, Dobby)
 */
async function main() {
  console.log('===============================================================');
  console.log('02 - DOB COOKBOOK & RENDERING PATTERNS (OFFLINE DEMO)');
  console.log('===============================================================\n');

  console.log('[1] Repository architecture (dob-cookbook/examples/):');
  console.log('    dob0/: 0.basic-loot, 1.colorful-loot, 2.regular-link-png, 3.btcfs-i0-png,');
  console.log('           4.ipfs-png, 5.regular-link-svg, 6.btcfs-i0-svg, 7.btcfs-i1-png, 8.btcfs-i1-svg');
  console.log('    dob1/: 0.basic-shape, 1.spore-genesis, 2.nervape-genesis, 3.azuki-genesis, 4.nervape-compose');
  console.log('    docs : BestPractices.md, BestPractices_ZH.md, FAQ.md, CONTRIBUTING.md');

  console.log('\n[2] DOB/0 vs DOB/1 (protocol family):');
  const rows = [
    ['Scope', 'Single-cell static rendering', 'Multi-cell composable rendering'],
    ['DNA location', 'Spore content itself', 'Spore content + linked decoder + cluster traits'],
    ['Decoder', 'Optional (direct image/SVG)', 'Required (on-chain RISC-V decoder binary)'],
    ['Use-case', 'PFP, collectible, on-chain blog asset', 'Gaming items, membership, composable wearables'],
    ['Week6 mint', 'YES - our JSON DOB is DOB/0-style (direct content)', 'Simulated below'],
  ];
  for (const [k, d0, d1] of rows) console.log(`    - ${k}: DOB/0=${d0} | DOB/1=${d1}`);

  console.log('\n[3] Storage integration patterns (trade-offs):');
  console.log('    - regular-link PNG/SVG: smallest cell, depends on external host (least on-chain)');
  console.log('    - IPFS PNG: content-addressed, needs gateway for render (middle ground)');
  console.log('    - BTCFS i0/i1: fully on-chain inscription reference, largest cell, most permanent');
  console.log('    - pure on-chain bytes (our Week6 JSON): 457 B, zero external dependency, fully verifiable');

  console.log('\n[4] Trait composition simulation (DNA -> visual, DOB/1-style):');
  const dna = '0x24126c4532e646cc7e715259a66ca49';
  console.log(`    input DNA (sporeId head): ${dna}`);
  // Deterministic pseudo-traits from DNA bytes (mirrors decoder logic conceptually)
  const bytes = Buffer.from(dna.slice(2), 'hex');
  const traits = {
    background: ['Void', 'Cell Blue', 'Nervos Green', 'DAO Gold'][bytes[0] % 4],
    frame: ['None', 'Bronze', 'Silver', 'Excalibur'][bytes[1] % 4],
    emblem: ['Molecule', 'RISC-V', 'Spore', 'Cluster'][bytes[2] % 4],
    rarity: bytes[3] > 200 ? 'Legendary' : bytes[3] > 100 ? 'Rare' : 'Common',
  };
  console.log(`    decoded traits: ${JSON.stringify(traits)}`);
  console.log('    real DOB/1 runs this inside ckb-vm decoder; here we simulate deterministically.');

  console.log('\n[5] Compatibility matrix (cookbook status, testnet + mainnet):');
  console.log('    Platform   | DOB/0 | DOB/1 (note)');
  console.log('    JoyID      |  PASS |  PASS (except spore-genesis known limit)');
  console.log('    Omiga      |  PASS |  PASS');
  console.log('    CKB Explorer| PASS |  PASS');
  console.log('    Mobit      |  PASS |  PASS');
  console.log('    Dobby      |  PASS |  PASS');
  console.log('    Our JSON DOB renders as raw JSON in explorer (no image decoder needed).');

  console.log('\n[6] Best-practices distilled:');
  console.log('    - Keep content <= 500 KB per tx (SDK default maxTransactionSize).');
  console.log('    - Prefer SVG/JSON for small fully-on-chain art; use BTCFS/IPFS refs for raster.');
  console.log('    - Pin decoder via code_hash (precompiled) or type_id (auto-download) for DOB/1.');

  console.log('\n02 Practical Execution Complete!');
}

main().catch((e) => { console.error('Execution error:', e); process.exit(1); });
