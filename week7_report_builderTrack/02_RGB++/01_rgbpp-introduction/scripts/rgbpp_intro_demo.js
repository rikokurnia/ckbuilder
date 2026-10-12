/**
 * 01 - RGB++ Introduction Demo (OFFLINE)
 * Covers: https://rgbpp.com/docs/introduction
 * - What/why RGB++, architecture (BTC layer + CKB layer), 4-step tx flow
 * - Offline commitment demo: commitment = sha256(CKB_TX_B | btc_utxo#1 | btc_utxo#2)
 * - Single-use seal lifecycle + 546-sat dust rule
 */
const crypto = require('crypto');

function sha256Hex(parts) {
  const h = crypto.createHash('sha256');
  for (const p of parts) h.update(Buffer.from(p));
  return '0x' + h.digest('hex');
}

async function main() {
  console.log('===============================================================');
  console.log('01 - RGB++ INTRODUCTION (OFFLINE DEMO)');
  console.log('===============================================================\n');

  console.log('[1] What is RGB++? (rgbpp.com/docs/introduction)');
  console.log('    - Binds Bitcoin UTXOs 1:1 to Turing-complete CKB Cells (isomorphic binding).');
  console.log('    - A Bitcoin UTXO acts as single-use seal: spend-once ownership proof.');
  console.log('    - CKB = public asset database + off-chain pre-settlement layer.');
  console.log('    - NOTE: RGB++ != RGB Protocol v0.11.1 (separate, architecturally unrelated).');

  console.log('\n[2] Architecture (two layers, one asset):');
  console.log('    BTC layer : UTXO mgmt + single-use seals + OP_RETURN commitments.');
  console.log('    CKB layer : programmable scripts + asset state + validation.');
  console.log('    Binding   : RGB++ lock args commit the BTC UTXO (txid+vout).');

  console.log('\n[3] Typical 4-step transaction flow:');
  console.log('    1. Off-chain pre-compute commitment from CKB tx + UTXOs + placeholders.');
  console.log('    2. BTC tx: spend seal UTXO, OP_RETURN(commitment), create new UTXO.');
  console.log('    3. CKB tx: record RGB++ asset state in output data.');
  console.log('    4. Verify: UTXO spent by owner + BTC tx exists (SPV) + CKB state rules hold.');

  console.log('\n[4] Offline commitment demo (light-paper notation):');
  const ckbTxB = 'CKB_TX_B(outputs=[rgbpp-lock cell, xudt 1000]] | placeholder seal btc_utxo#2)';
  const utxo1 = 'btc_utxo#1 (txid ab12.. | vout 0 | 546 sats)';
  const utxo2 = 'btc_utxo#2 (txid cd34.. | vout 1 | 546 sats)';
  const commitment = sha256Hex([ckbTxB, utxo1, utxo2]);
  console.log(`    CKB_TX_B : ${ckbTxB}`);
  console.log(`    seal in  : ${utxo1}`);
  console.log(`    seal out : ${utxo2}`);
  console.log(`    commitment = sha256(CKB_TX_B | utxo1 | utxo2)`);
  console.log(`               = ${commitment.slice(0, 42)}...`);
  const recomputed = sha256Hex([ckbTxB, utxo1, utxo2]);
  console.log(`    re-verify (owner/validator recompute): match=${recomputed === commitment}`);
  const tampered = sha256Hex([ckbTxB + 'MUTATED', utxo1, utxo2]);
  console.log(`    tamper test (1 byte changed): match=${tampered === commitment} (must be false)`);

  console.log('\n[5] Seal lifecycle + dust rule:');
  console.log('    - Seal = live UTXO; spending it CLOSES the seal (ownership moves).');
  console.log('    - New seals use dust limit 546 sats (same as RGB++ issuance default).');
  console.log('    - Double-spend impossible: Bitcoin consensus allows one spend per UTXO.');

  console.log('\n[6] Key features recap: single-use seals, isomorphic binding,');
  console.log('    Turing-complete CKB-VM scripts, cross-chain assets, SPV verification.');

  console.log('\n01 Practical Execution Complete!');
}

main().catch((e) => { console.error('Execution error:', e); process.exit(1); });
