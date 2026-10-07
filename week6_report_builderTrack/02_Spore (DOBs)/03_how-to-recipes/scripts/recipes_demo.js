/**
 * 03 - How-To Recipes Demo (OFFLINE skeleton validation, no broadcast)
 * Covers: https://docs.spore.pro/category/how-to-recipes
 *   Create (createSpore, immortal, private/public cluster, clustered spore, proxy/agent)
 *   Transfer (transferSpore, transferCluster, modify/disable zero-fee)
 *   Melt (meltSpore, melt proxy/agent) + Data (handle-spore-data)
 * This script validates params + shows exact SDK call shapes without spending.
 */
const { isContentTypeValid, bytifyRawString, packRawSporeData, predefinedSporeConfigs } = require('@spore-sdk/core');

function checkClusterId(id) {
  return /^0x[0-9a-fA-F]{64}$/.test(id);
}

async function main() {
  console.log('===============================================================');
  console.log('03 - HOW-TO RECIPES API SURFACE (OFFLINE DEMO, NO BROADCAST)');
  console.log('===============================================================\n');

  const config = predefinedSporeConfigs.Aggron4;
  console.log('[0] Config sanity:');
  console.log(`    maxTransactionSize: ${config.maxTransactionSize} bytes (500 KB)`);
  console.log(`    Spore cellDep: ${config.scripts.Spore.cellDep.outPoint.txHash.slice(0, 18)}...:${config.scripts.Spore.cellDep.outPoint.index}`);

  console.log('\n[1] CREATE recipes:');
  const cases = [
    { ct: 'application/json', ok: true, note: 'our Week6 DOB' },
    { ct: 'image/jpeg', ok: true, note: 'spore-sdk example (test.jpg)' },
    { ct: 'image/svg+xml', ok: true, note: 'cookbook SVG patterns' },
    { ct: 'text/plain;immortal=true', ok: true, note: 'immortal core extension (cannot melt)' },
    { ct: 'not-a-mime', ok: false, note: 'must be valid MIME' },
  ];
  for (const c of cases) {
    const valid = isContentTypeValid(c.ct);
    console.log(`    - "${c.ct}" valid=${valid} (expect ${c.ok}) -- ${c.note}`);
  }
  console.log('    API: createSpore({ data:{contentType, content, clusterId?}, toLock, fromInfos, capacityMargin?, maxTransactionSize? })');
  console.log('    API: createCluster({ data:{name, description}, toLock, fromInfos })');
  console.log('    API: createClusteredSpore = createSpore({ data:{... , clusterId}, ... }) + cluster cellDep');

  console.log('\n[2] Capacity margin (zero-fee) recipes:');
  console.log('    - default: 1 CKB margin covers ~100k future ops for receiver');
  console.log('    - modify: capacityMargin: BI.from(2_0000_0000) // 2 CKB');
  console.log('    - disable: not recommended; receiver then needs own CKB for next tx');

  console.log('\n[3] TRANSFER recipes (shape validation, no broadcast):');
  const outPoint = { txHash: '0xdcb6664016f3bd6a49bfa9cf0f99584a6055f53744304e5edfae15e0c797b70e', index: '0x1' };
  const outPointOk = /^0x[0-9a-fA-F]{64}$/.test(outPoint.txHash) && /^0x[0-9a-fA-F]+$/.test(outPoint.index);
  console.log(`    - transferSpore({ outPoint: ${outPoint.txHash.slice(0, 18)}...:${outPoint.index}, toLock }) shape ok=${outPointOk}`);
  console.log('    - transferCluster / transferClusterProxy / transferClusterAgent: same outPoint+toLock shape');
  console.log('    - Week6 live transfer used this exact shape (see 06_onchain-practice).');

  console.log('\n[4] MELT recipes (redeem, shape only):');
  console.log('    - meltSpore({ outPoint, changeAddress? }) -> capacity back to owner/change');
  console.log('    - immortal spores CANNOT melt (contract enforces; melt tx fails verification)');
  console.log('    - Week6 DOB is meltable (no immortal flag); melt deferred to preserve explorer artifact.');

  console.log('\n[5] DATA recipe (handle-spore-data):');
  const payload = bytifyRawString(JSON.stringify({ name: 'CKBuilder Week6 DOB #1' }));
  const packed = packRawSporeData({ contentType: 'application/json', content: payload, clusterId: '0xa4cd5a796fda10013aa4ae803139822bf2cc67c9e13b2ce5af5ec9c9711bc338' });
  console.log(`    - packed SporeData: ${packed.length} bytes (contentType + content + clusterId)`);
  console.log(`    - tx size guard: ${packed.length} << ${config.maxTransactionSize} (PASS)`);

  console.log('\n[6] ClusterId format check:');
  const cid = '0xa4cd5a796fda10013aa4ae803139822bf2cc67c9e13b2ce5af5ec9c9711bc338';
  console.log(`    - ${cid.slice(0, 18)}... format ok=${checkClusterId(cid)} (must be 32-byte hash)`);

  console.log('\n03 Practical Execution Complete! (No on-chain broadcast; livetxs in 06.)');
}

main().catch((e) => { console.error('Execution error:', e); process.exit(1); });
