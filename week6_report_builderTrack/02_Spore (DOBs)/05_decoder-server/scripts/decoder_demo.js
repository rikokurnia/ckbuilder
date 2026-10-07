/**
 * 05 - DOB Decoder Standalone Server Demo (OFFLINE simulation, no cargo build)
 * Covers: https://github.com/sporeprotocol/dob-decoder-standalone-server
 * - embedded ckb-vm executor vs native mode
 * - decoder binary cache (code_hash_* vs type_id_*)
 * - render cache (DNA immutable -> output immutable)
 * - JsonRpc dob_decode request/response simulation for our live Spore
 * NOTE: Real server needs `cargo run` (Rust). Here we simulate its behavior
 * deterministically so the report step is reproducible without Rust toolchain.
 */
const crypto = require('crypto');

const LIVE_SPORE_ID = '0x24126c4532e646cc7e715259a66ca495d997014ceff65fb90044fc7984fcc053';

function simulateDecoderRender(sporeIdHex) {
  const h = crypto.createHash('sha256').update(Buffer.from(sporeIdHex.slice(2), 'hex')).digest();
  const traits = {
    background: ['Void', 'Cell Blue', 'Nervos Green', 'DAO Gold'][h[0] % 4],
    frame: ['None', 'Bronze', 'Silver', 'Excalibur'][h[1] % 4],
    emblem: ['Molecule', 'RISC-V', 'Spore', 'Cluster'][h[2] % 4],
    rarity: h[3] > 200 ? 'Legendary' : h[3] > 100 ? 'Rare' : 'Common',
  };
  return {
    sporeId: sporeIdHex,
    protocol: 'DOB/0 (direct JSON content; no VM decoder required)',
    render: { contentType: 'application/json', traits, dnaHash: '0x' + h.toString('hex').slice(0, 16) },
  };
}

async function main() {
  console.log('===============================================================');
  console.log('05 - DOB DECODER STANDALONE SERVER (OFFLINE SIMULATION)');
  console.log('===============================================================\n');

  console.log('[1] What the server does (one-step DOB rendering):');
  console.log('    DNA fetch -> decoder binary load -> ckb-vm exec -> traits JSON -> cache -> response');
  console.log('    Repo: sporeprotocol/dob-decoder-standalone-server (Rust, 97 commits, 2 stars).');

  console.log('\n[2] ckb-vm executor modes:');
  console.log('    - embedded_vm (default, recommended): standalone ckb-vm inside server binary');
  console.log('    - native mode (advanced): user-supplied VM env for custom sandboxing');

  console.log('\n[3] Decoder binary cache (settings.toml):');
  console.log('    - code_hash_<hash>.bin : precompile + place manually (offline, deterministic)');
  console.log('    - type_id_<hash>.bin   : auto-download from on-chain decoder cell, persist to cache/');
  console.log('    Our Week6 JSON DOB needs NO decoder (DOB/0 direct content); DOB/1 would hit this cache.');

  console.log('\n[4] Render cache (settings.toml):');
  console.log('    - Spore/Cluster cells immutable -> DNA immutable -> render output immutable');
  console.log('    - Cache key = sporeId; TTL indefinite; safe to serve stale-forever on hit.');

  console.log('\n[5] JsonRpc interface (standalone_server feature):');
  console.log('    $ RUST_LOG=dob_decoder_server=debug cargo run   # serves http://localhost:8090');
  const req = { id: 2, jsonrpc: '2.0', method: 'dob_decode', params: [LIVE_SPORE_ID.slice(2)] };
  console.log(`    request : ${JSON.stringify(req)}`);
  const out = simulateDecoderRender(LIVE_SPORE_ID);
  const res = { jsonrpc: '2.0', id: 2, result: out };
  console.log(`    response: ${JSON.stringify(res).slice(0, 220)}...`);
  console.log(`    decoded traits: ${JSON.stringify(out.render.traits)}`);

  console.log('\n[6] Protocol version pinning:');
  console.log('    - One server instance serves ONE DOB protocol version (settings.toml).');
  console.log('    - Run parallel instances for DOB/0 vs DOB/1 if supporting both.');
  console.log('    - Error codes: see src/types.rs (e.g. decoder-missing, vm-exec-fail, bad-spore-id).');

  console.log('\n[7] Honest boundary:');
  console.log('    - This demo SIMULATES decoding; no cargo build / no port 8090 was run here.');
  console.log('    - Live Spore content remains verifiable via explorer + get_transaction RPC (see 06).');

  console.log('\n05 Practical Execution Complete!');
}

main().catch((e) => { console.error('Execution error:', e); process.exit(1); });
