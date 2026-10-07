/**
 * 01 - Spore Protocol 101 & Technical Design Demo (OFFLINE)
 * Covers: https://docs.spore.pro/ + /basics/spore-101 + /basics/technical-design/
 * - Spore vs Cluster mental model
 * - Redeemable intrinsic value economics
 * - Zero-fee transfer margin
 * - Molecule SporeData pack/unpack via @spore-sdk/core
 * - Cell capacity math (1 byte = 1 CKB collateral)
 */
const { packRawSporeData, unpackToRawSporeData, bytifyRawString, bufferToRawString, decodeContentType, isContentTypeValid, predefinedSporeConfigs } = require('@spore-sdk/core');

function capacityForSpore(contentBytes, lockArgsLen = 20) {
  // Simplified: 8 (capacity) + 32 (codeHash) + 1 (hashType) + lockArgs + typeArgs(32) + dataLen
  // Real cell also includes output overhead; this estimates state collateral.
  const baseOverhead = 8 + 32 + 1 + lockArgsLen + 32;
  return baseOverhead + contentBytes.length;
}

async function main() {
  console.log('===============================================================');
  console.log('01 - SPORE PROTOCOL 101 & TECHNICAL DESIGN (OFFLINE DEMO)');
  console.log('===============================================================\n');

  const config = predefinedSporeConfigs.Aggron4;
  console.log(`[1] Active SporeConfig: Aggron4 (testnet)`);
  console.log(`    CKB node : ${config.ckbNodeUrl}`);
  console.log(`    Indexer  : ${config.ckbIndexerUrl}`);
  console.log(`    Spore codeHash   : ${config.scripts.Spore.script.codeHash}`);
  console.log(`    Cluster codeHash : ${config.scripts.Cluster.script.codeHash}`);

  console.log('\n[2] Core mental model (docs.spore.pro/basics/spore-101):');
  console.log('    - Spore = on-chain digital object (DOB), ONE cell = ONE object');
  console.log('    - Cluster = optional collection tag; Spore -> at most 1 Cluster; Cluster -> N Spores');
  console.log('    - Cluster is indestructible + immutable; Spore is meltable (redeem) unless immortal=true');
  console.log('    - Fully on-chain: content bytes live in cell data, not a URL pointer');

  console.log('\n[3] Redeemable intrinsic value (mint = acquire capital, not spend gas):');
  const samples = [
    { label: 'tiny JSON DOB (457 B, our Week6 mint)', bytes: 457 },
    { label: 'small SVG (5 KB)', bytes: 5 * 1024 },
    { label: 'photo JPEG (100 KB)', bytes: 100 * 1024 },
  ];
  for (const s of samples) {
    const collateral = capacityForSpore({ length: s.bytes });
    const ckb = (collateral / 1e8).toFixed(8);
    console.log(`    - ${s.label}: ~${collateral} bytes state -> ~${ckb} CKB locked (redeemable via melt)`);
  }
  console.log('    Rule: larger content needs more reserved CKBytes, but it stays YOUR capital.');

  console.log('\n[4] Molecule SporeData pack/unpack (technical-design/data-structure):');
  const demoData = {
    contentType: 'application/json',
    content: bytifyRawString(JSON.stringify({ name: 'CKBuilder Week6 DOB #1' })),
    clusterId: '0xa4cd5a796fda10013aa4ae803139822bf2cc67c9e13b2ce5af5ec9c9711bc338',
  };
  console.log(`    contentType valid: ${isContentTypeValid(demoData.contentType)}`);
  console.log(`    decoded contentType: ${JSON.stringify(decodeContentType(demoData.contentType))}`);
  const packed = packRawSporeData(demoData);
  const packedHex = Buffer.from(packed).toString('hex');
  console.log(`    packed bytes: ${packed.length} (hex head: 0x${packedHex.slice(0, 64)}...)`);
  const unpacked = unpackToRawSporeData(packed);
  const unpackedCt = typeof unpacked.contentType === 'string' ? unpacked.contentType : bufferToRawString(unpacked.contentType);
  const rawOrig = Buffer.from(demoData.content).toString('hex');
  const rawUnpacked = typeof unpacked.content === 'string' && unpacked.content.startsWith('0x') ? unpacked.content.slice(2).toLowerCase() : Buffer.from(unpacked.content).toString('hex').toLowerCase();
  console.log(`    unpacked contentType: ${unpackedCt}`);
  console.log(`    unpacked clusterId : ${unpacked.clusterId}`);
  console.log(`    roundtrip content match: ${rawUnpacked === rawOrig}`);

  console.log('\n[5] Zero-fee transfer margin (technical-design/fee-transfer):');
  console.log('    - createSpore defaults capacityMargin = 1 CKB (100,000,000 shannons)');
  console.log('    - margin pre-funds ~100k future txs so receivers need NO gas to transfer/melt');
  console.log('    - override: createSpore({ ..., capacityMargin: BI.from(2_0000_0000) }) for 2 CKB');

  console.log('\n[6] On-chain privacy note (technical-design/on-chain-privacy):');
  console.log('    - Spore content + owner lock are public; privacy comes from pseudonymous locks,');
  console.log('      not encryption. Do NOT put secrets in Spore content.');

  console.log('\n01 Practical Execution Complete!');
}

main().catch((e) => { console.error('Execution error:', e); process.exit(1); });
