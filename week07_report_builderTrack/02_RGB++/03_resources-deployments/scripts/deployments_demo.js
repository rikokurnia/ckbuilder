/**
 * 03 - RGB++ Resources & Deployments Demo (OFFLINE)
 * Covers: http://rgbpp.com/docs/resources (+ components/spv/explorer context)
 * - Script standard, SPV stack (4 repos), explorer, btc-assets-api endpoints + gating
 * - Meepo mainnet/testnet deployments (code_hash + cellDeps) + format validation
 * - Mainnet whitelist boundary
 */
const DEPLOYMENTS = {
  mainnet: {
    rgbpp: { codeHash: '0xbc6c568a1a0d0a09f6844dc9d74ddb4343c32143ff25f727c59edf4fb72d6936', hashType: 'type', txHash: '0x04c5c3e69f1aa6ee27fb9de3d15a81704e387ab3b453965adbe0b6ca343c6f41', index: '0x0', depType: 'code' },
    btcTime: { codeHash: '0x70d64497a075bd651e98ac030455ea200637ee325a12ad08aff03f1a117e5a62', hashType: 'type', txHash: '0x6257bf4297ee75fcebe2654d8c5f8d93bc9fc1b3dc62b8cef54ffe166162e996', index: '0x0', depType: 'code' },
  },
  testnet: {
    rgbpp: { codeHash: '0x61ca7a4796a4eb19ca4f0d065cb9b10ddcf002f10f7cbb810c706cb6bb5c3248', hashType: 'type', txHash: '0xf1de59e973b85791ec32debbba08dff80c63197e895eb95d67fc1e9f6b413e00', index: '0x0', depType: 'code' },
    btcTime: { codeHash: '0x00cdf8fab0f8ac638758ebf5ea5e4052b1d71e8a77b9f43139718621f6849326', hashType: 'type', txHash: '0xde0f87878a97500f549418e5d46d2f7704c565a262aa17036c9c1c13ad638529', index: '0x0', depType: 'code' },
  },
};

function isHash(h, n) { return new RegExp(`^0x[0-9a-fA-F]{${n}}$`).test(h); }

async function main() {
  console.log('===============================================================');
  console.log('03 - RGB++ RESOURCES & DEPLOYMENTS (OFFLINE DEMO)');
  console.log('===============================================================\n');

  console.log('[1] Script standard (lockscript-design PRD, EN+CN):');
  console.log('    - RGB++ lock: args commit BTC UTXO (txid+vout); verifies seal + commitment + state rules.');
  console.log('    - BTC_TIME_lock: leap destination; unlock after N confirmations (default 6), no BTC tx needed.');
  console.log('    - Repo: RGBPlusPlus/rgbpp (contracts) + design PRD docs.');

  console.log('\n[2] CKB Bitcoin SPV stack (light client on CKB):');
  console.log('    - ckb-bitcoin-spv (lib) + -contracts + -service + Design.md.');
  console.log('    - Role: prove BTC tx existence/confirmations inside CKB scripts (witness-carried proofs).');

  console.log('\n[3] Explorer + btc-assets-api:');
  console.log('    - Explorer: https://explorer.rgbpp.com/en (txs + assets).');
  console.log('    - API testnet: https://api-testnet.rgbpp.com | https://api.testnet.rgbpp.io');
  console.log('    - API mainnet: whitelisted only (contact buidl@rgbpp.com).');
  console.log('    - FINDING: testnet currently gates app/domain server-side (ASSETS_API_INVALID_PARAM without registration).');
  console.log('      Public fallback for BTC-leg liveness: mempool.space testnet API (free, no key) — used in 05.');

  console.log('\n[4] Deployment validation (docs values, format + mainnet!=testnet):');
  let allOk = true;
  for (const [net, scripts] of Object.entries(DEPLOYMENTS)) {
    for (const [name, d] of Object.entries(scripts)) {
      const ok = isHash(d.codeHash, 64) && isHash(d.txHash, 64) && (d.hashType === 'type');
      allOk = allOk && ok;
      console.log(`    - ${net}.${name}: codeHash ${d.codeHash.slice(0, 12)}... format ok=${ok}`);
    }
  }
  const distinct = DEPLOYMENTS.mainnet.rgbpp.codeHash !== DEPLOYMENTS.testnet.rgbpp.codeHash
    && DEPLOYMENTS.mainnet.btcTime.codeHash !== DEPLOYMENTS.testnet.btcTime.codeHash;
  console.log(`    - mainnet vs testnet codeHashes distinct: ${distinct} (must be true)`);
  console.log(`    - overall format check: ${allOk && distinct ? 'PASS' : 'FAIL'}`);
  console.log('    Live on-chain confirmation of testnet cells happens in 05 (Pudge RPC).');

  console.log('\n[5] Community + legacy SDK pointers:');
  console.log('    - RGB->RGB++ article (talk #7791), RGBPlusPlus/rgbpp-sdk (legacy TS SDK, still maintained).');
  console.log('    - Primary SDK now lives in CCC rgbpp-sdk branch (packages/rgbpp) — see 04.');

  console.log('\n03 Practical Execution Complete!');
}

main().catch((e) => { console.error('Execution error:', e); process.exit(1); });
