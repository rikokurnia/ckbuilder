const { createSpore, predefinedSporeConfigs, defaultEmptyWitnessArgs, updateWitnessArgs, isScriptValueEquals, bytifyRawString } = require('@spore-sdk/core');
const { hd, helpers, RPC, BI } = require('@ckb-lumos/lumos');
const { common } = require('@ckb-lumos/common-scripts');

const PRIVATE_KEY = process.env.PRIVATE_KEY || '0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574';
const config = predefinedSporeConfigs.Aggron4;
// Reuse live Cluster from previous step
const CLUSTER_ID = '0xa4cd5a796fda10013aa4ae803139822bf2cc67c9e13b2ce5af5ec9c9711bc338';
const CLUSTER_TX = '0xcba1eb851313ee0a9f718a214c50fb725e7d3bb08d898b1e5e5a536f9aa4d3b9';

function createWallet(privateKey) {
  const Secp256k1Blake160 = config.lumos.SCRIPTS.SECP256K1_BLAKE160;
  const lock = {
    codeHash: Secp256k1Blake160.CODE_HASH,
    hashType: Secp256k1Blake160.HASH_TYPE,
    args: hd.key.privateKeyToBlake160(privateKey),
  };
  const address = helpers.encodeToAddress(lock, { config: config.lumos });
  function signMessage(message) { return hd.key.signRecoverable(message, privateKey); }
  function signTransaction(txSkeleton) {
    const signingEntries = txSkeleton.get('signingEntries');
    const signatures = new Map();
    const inputs = txSkeleton.get('inputs');
    let witnesses = txSkeleton.get('witnesses');
    for (let i = 0; i < signingEntries.size; i++) {
      const entry = signingEntries.get(i);
      if (entry.type === 'witness_args_lock') {
        const input = inputs.get(entry.index);
        if (!input || !isScriptValueEquals(input.cellOutput.lock, lock)) continue;
        if (!signatures.has(entry.message)) signatures.set(entry.message, signMessage(entry.message));
        const sig = signatures.get(entry.message);
        const witness = witnesses.get(entry.index, defaultEmptyWitnessArgs);
        witnesses = witnesses.set(entry.index, updateWitnessArgs(witness, 'lock', sig));
      }
    }
    return txSkeleton.set('witnesses', witnesses);
  }
  async function signAndSend(txSkeleton) {
    const rpc = new RPC(config.ckbNodeUrl);
    txSkeleton = common.prepareSigningEntries(txSkeleton, { config: config.lumos });
    txSkeleton = signTransaction(txSkeleton);
    const tx = helpers.createTransactionFromSkeleton(txSkeleton);
    return await rpc.sendTransaction(tx, 'passthrough');
  }
  return { lock, address, signAndSend };
}

async function getTxStatus(txHash) {
  const res = await fetch(config.ckbNodeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 1, jsonrpc: '2.0', method: 'get_transaction', params: [txHash] }),
  });
  const json = await res.json();
  return json?.result?.tx_status || null;
}

async function waitCommitted(txHash) {
  process.stdout.write('Waiting for confirmation');
  for (let i = 0; i < 30; i++) {
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 4000));
    try {
      const st = await getTxStatus(txHash);
      if (st && st.status === 'committed') {
        console.log(`\nCommitted in block ${parseInt(st.block_number, 16)} (${st.block_number})`);
        console.log(`BlockHash: ${st.block_hash}`);
        return st;
      }
    } catch (_) {}
  }
  console.log('\nTimeout (will verify via explorer/RPC manually)');
  return null;
}

async function main() {
  console.log('===============================================================');
  console.log('SPORE LIVE MINT (CLUSTERED JSON DOB) - CKB Testnet');
  console.log('===============================================================');
  const wallet = createWallet(PRIVATE_KEY);
  console.log(`Signer: ${wallet.address}`);
  console.log(`Cluster ID: ${CLUSTER_ID}`);
  console.log(`Cluster Tx: ${CLUSTER_TX}`);

  const dobContent = {
    name: 'CKBuilder Week6 DOB #1',
    description: 'Riko Kurnia Sandi - Spore DOB practice: fully on-chain JSON digital object with redeemable CKB value',
    image: 'onchain://week6-spore-dob-01.json',
    attributes: [
      { trait_type: 'Track', value: 'CKB Builder' },
      { trait_type: 'Week', value: '6 - Spore DOBs' },
      { trait_type: 'Standard', value: 'Spore Protocol + DOB/0' },
      { trait_type: 'Network', value: 'Pudge Testnet' },
    ],
    collection: 'CKBuilder Week6 Spore Collection',
  };
  const contentStr = JSON.stringify(dobContent);
  console.log(`\nContent (${contentStr.length} bytes): ${contentStr.slice(0, 120)}...`);

  console.log('\nConstructing Spore cell...');
  const { txSkeleton, outputIndex } = await createSpore({
    data: {
      contentType: 'application/json',
      content: bytifyRawString(contentStr),
      clusterId: CLUSTER_ID,
    },
    fromInfos: [wallet.address],
    toLock: wallet.lock,
    config,
  });

  console.log(`Spore output index: ${outputIndex}`);
  const sporeCell = txSkeleton.get('outputs').get(outputIndex);
  const sporeId = sporeCell.cellOutput.type.args;
  console.log(`Spore ID (Type ID args): ${sporeId}`);
  console.log(`Spore Type codeHash: ${sporeCell.cellOutput.type.codeHash}`);
  console.log(`Spore capacity: ${sporeCell.cellOutput.capacity} (${(BigInt(sporeCell.cellOutput.capacity) / 100000000n).toString()} CKB)`);

  console.log('\nSigning and broadcasting...');
  const hash = await wallet.signAndSend(txSkeleton);
  console.log(`Transaction Hash: ${hash}`);
  console.log(`Explorer: https://pudge.explorer.nervos.org/transaction/${hash}`);

  const st = await waitCommitted(hash);
  console.log('\nDone.');
  console.log(JSON.stringify({ txHash: hash, outputIndex, sporeId, clusterId: CLUSTER_ID, blockNumber: st ? parseInt(st.block_number, 16).toString() : null, blockHash: st?.block_hash || null }, null, 2));
}

main().catch((e) => { console.error('\nExecution error:', e); process.exit(1); });
