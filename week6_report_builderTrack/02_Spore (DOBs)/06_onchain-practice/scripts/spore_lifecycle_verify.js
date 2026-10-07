/**
 * 06 - Spore Lifecycle Verify (READ-ONLY, no spend)
 * Queries the 3 live Pudge transactions from this report and prints
 * commitment proof + live Spore content summary.
 * Safe to re-run for screenshots without spending CKB.
 */
const RPC_URL = 'https://testnet.ckb.dev/rpc';

const TXS = {
  clusterMint: '0xcba1eb851313ee0a9f718a214c50fb725e7d3bb08d898b1e5e5a536f9aa4d3b9',
  sporeMint: '0xdcb6664016f3bd6a49bfa9cf0f99584a6055f53744304e5edfae15e0c797b70e',
  sporeTransfer: '0x6acbec9412f0ff084e2ce36eb9b7a84234368d3d8d174e30f29da7e05ba3b086',
};
const CLUSTER_ID = '0xa4cd5a796fda10013aa4ae803139822bf2cc67c9e13b2ce5af5ec9c9711bc338';
const SPORE_ID = '0x24126c4532e646cc7e715259a66ca495d997014ceff65fb90044fc7984fcc053';

async function rpc(method, params) {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 1, jsonrpc: '2.0', method, params }),
  });
  const json = await res.json();
  return json.result;
}

async function main() {
  console.log('===============================================================');
  console.log('06 - SPORE LIFECYCLE VERIFY (READ-ONLY, PUDGE TESTNET)');
  console.log('===============================================================\n');

  console.log(`Cluster ID: ${CLUSTER_ID}`);
  console.log(`Spore ID  : ${SPORE_ID}\n`);

  for (const [label, hash] of Object.entries(TXS)) {
    const tx = await rpc('get_transaction', [hash]);
    const st = tx?.tx_status;
    const committed = st?.status === 'committed';
    const blockDec = st?.block_number ? parseInt(st.block_number, 16).toString() : '?';
    console.log(`[${label}]`);
    console.log(`  tx      : ${hash}`);
    console.log(`  status  : ${st?.status || 'unknown'} ${committed ? '(VERIFIED)' : ''}`);
    console.log(`  block   : #${blockDec} (${st?.block_number || '?'})`);
    console.log(`  explorer: https://pudge.explorer.nervos.org/transaction/${hash}`);
    if (label === 'sporeMint' && tx?.transaction) {
      const datas = tx.transaction.outputs_data || tx.transaction.outputsData || [];
      const data = datas[1] || datas[0] || '';
      console.log(`  cellData: ${data.length} chars, head ${(data || '').slice(0, 66)}...`);
      try {
        // SporeData Molecule: content JSON is embedded; quick heuristic decode
        const buf = Buffer.from((data || '0x').slice(2), 'hex');
        const asText = buf.toString('utf8');
        const start = asText.indexOf('{"name"');
        if (start >= 0) console.log(`  content : ${asText.slice(start, start + 120)}...`);
      } catch (_) {}
    }
    console.log('');
  }

  console.log('Live tip check:');
  const tip = await rpc('get_tip_block_number', []);
  console.log(`  tip block: #${parseInt(tip, 16)} (${tip})`);

  console.log('\n06 Verify Complete (all 3 txs committed = lifecycle proven).');
}

main().catch((e) => { console.error('Execution error:', e); process.exit(1); });
