const { transferSpore, getSporeByOutPoint, predefinedSporeConfigs, defaultEmptyWitnessArgs, updateWitnessArgs, isScriptValueEquals } = require('@spore-sdk/core');
const { hd, helpers, RPC } = require('@ckb-lumos/lumos');
const { common } = require('@ckb-lumos/common-scripts');

const PRIVATE_KEY = process.env.PRIVATE_KEY || '0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574';
const config = predefinedSporeConfigs.Aggron4;

const SPORE_TX = '0xdcb6664016f3bd6a49bfa9cf0f99584a6055f53744304e5edfae15e0c797b70e';
const SPORE_INDEX = '0x1';
const SPORE_ID = '0x24126c4532e646cc7e715259a66ca495d997014ceff65fb90044fc7984fcc053';

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
  console.log('\nTimeout');
  return null;
}

async function main() {
  console.log('===============================================================');
  console.log('SPORE TRANSFER (ZERO-FEE DEMO) - CKB Testnet');
  console.log('===============================================================');
  const wallet = createWallet(PRIVATE_KEY);
  console.log(`Signer: ${wallet.address}`);
  console.log(`Spore outPoint: ${SPORE_TX}:${SPORE_INDEX}`);
  console.log(`Spore ID: ${SPORE_ID}`);

  console.log('\nFetching live Spore cell for pre-flight check...');
  try {
    const spore = await getSporeByOutPoint({ outPoint: { txHash: SPORE_TX, index: SPORE_INDEX }, config });
    console.log(`Live Spore found: contentType=${spore.data.contentType}, contentBytes=${spore.data.content.length} bytes`);
    console.log(`ClusterId: ${spore.data.clusterId || '(none)'}`);
  } catch (e) {
    console.log(`Pre-flight query note: ${e.message || e}`);
  }

  console.log('\nConstructing transferSpore skeleton (toLock = same owner, demonstrates zero-fee path)...');
  const { txSkeleton } = await transferSpore({
    outPoint: { txHash: SPORE_TX, index: SPORE_INDEX },
    toLock: wallet.lock,
    config,
  });
  console.log(`Inputs: ${txSkeleton.get('inputs').size}, Outputs: ${txSkeleton.get('outputs').size}`);

  console.log('\nSigning and broadcasting...');
  const hash = await wallet.signAndSend(txSkeleton);
  console.log(`Transaction Hash: ${hash}`);
  console.log(`Explorer: https://pudge.explorer.nervos.org/transaction/${hash}`);

  const st = await waitCommitted(hash);
  console.log('\nDone.');
  console.log(JSON.stringify({ txHash: hash, sporeId: SPORE_ID, blockNumber: st ? parseInt(st.block_number, 16).toString() : null }, null, 2));
}

main().catch((e) => { console.error('\nExecution error:', e); process.exit(1); });
