/**
 * 04 - SDK / Demos / Examples / Contracts Demo (OFFLINE)
 * Covers: https://docs.spore.pro/resources/demos + /resources/examples + /resources/spore-sdk + /resources/contracts
 * - spore-sdk surface (composed vs joint APIs)
 * - spore-first-example + a-simple-demo flow
 * - Lock-script examples (secp256k1, ACP, Omnilock)
 * - Contract versions (mainnet codeHash + cellDeps)
 */
const sdk = require('@spore-sdk/core');

async function main() {
  console.log('===============================================================');
  console.log('04 - SDK / DEMOS / EXAMPLES / CONTRACTS (OFFLINE DEMO)');
  console.log('===============================================================\n');

  console.log('[1] spore-sdk package:');
  console.log('    - npm i @spore-sdk/core (this repo uses v' + require('@spore-sdk/core/package.json').version + ')');
  console.log('    - TS-first, lumos-based; Node.js works out-of-box, browser needs node-polyfills');

  const composed = ['createSpore', 'transferSpore', 'meltSpore', 'createCluster', 'transferCluster'].filter((k) => typeof sdk[k] === 'function');
  const joints = ['injectNewSporeOutput', 'injectLiveSporeCell', 'injectNewSporeIds', 'getSporeById', 'getClusterById'].filter((k) => typeof sdk[k] === 'function');
  const utils = ['packRawSporeData', 'unpackToRawSporeData', 'bytifyRawString', 'isContentTypeValid', 'generateTypeId'].filter((k) => typeof sdk[k] === 'function');
  console.log(`    - composed APIs present: ${composed.join(', ')}`);
  console.log(`    - joint APIs present   : ${joints.join(', ')}`);
  console.log(`    - utils present        : ${utils.join(', ')}`);
  console.log('    Pattern: composed = joint blocks assembled (create = inject output + fund + assign Type ID).');

  console.log('\n[2] Scenario example: spore-first-example (hello world):');
  console.log('    1. fetchLocalImage(test.jpg) -> Uint8Array');
  console.log('    2. createSpore({ data:{contentType:"image/jpeg", content}, fromInfos, toLock })');
  console.log('    3. signAndSend(txSkeleton) -> hash + outputIndex + sporeId');
  console.log('    Week6 mirrors this with JSON content + clusterId (see 06).');

  console.log('\n[3] Web demo: a-simple-demo (Next.js + React + spore-sdk):');
  console.log('    - Online: https://a-simple-demo.spore.pro | Repo: sporeprotocol/spore-demo');
  console.log('    - Features: create/transfer cluster, mint/transfer/melt spore, MetaMask + JoyID connect');
  console.log('    - Our offline scripts replicate its core tx logic in Node without wallet UI.');

  console.log('\n[4] Lock-script examples (who can own a Spore):');
  console.log('    - secp256k1 (CKB default): simplest, Week6 uses this; examples/secp256k1/apis/*');
  console.log('    - anyone-can-pay (ACP): public cluster usable by anyone, optional fee per mint');
  console.log('    - omnilock: BTC/ETH/EOS verifications, interoperable ownership');
  console.log('    Week6 toLock = secp256k1-blake160 (args 0xc478...dd7e5), same key as Week4/5.');

  console.log('\n[5] Contracts (spore-contract repo, type scripts):');
  const cfg = sdk.predefinedSporeConfigs.Aggron4;
  console.log(`    - Testnet Spore codeHash   : ${cfg.scripts.Spore.script.codeHash} (hashType data1)`);
  console.log(`    - Testnet Spore cellDep    : ${cfg.scripts.Spore.cellDep.outPoint.txHash.slice(0, 18)}...:${cfg.scripts.Spore.cellDep.outPoint.index}`);
  console.log(`    - Testnet Cluster codeHash : ${cfg.scripts.Cluster.script.codeHash} (hashType data1)`);
  console.log('    - Mainnet versions pinned in docs/resources/contracts (Spore 0x4a4dce..., Cluster 0x7366a6...).');
  console.log('    - Type ID rule: SPORE_ID = hash(first_input) | output_index (same family as Week4 Class 6).');

  console.log('\n04 Practical Execution Complete!');
}

main().catch((e) => { console.error('Execution error:', e); process.exit(1); });
