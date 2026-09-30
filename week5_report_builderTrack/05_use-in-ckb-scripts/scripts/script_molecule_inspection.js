/**
 * CKB-VM Molecule Script Inspection & Invariant Validation Simulation
 * Demonstrates:
 * 1. Packaging state into canonical Molecule binary for cell_data
 * 2. Simulating CKB-VM low-level pointer inspection without memory copying
 * 3. Enforcing contract business rules (state invariants) with exit codes
 */

const { mol, bytesTo } = require('@ckb-ccc/core');

// On-chain State Schema
const CellStateTable = mol.table({
  version: mol.Uint32LE,
  owner_lock_hash: mol.Byte32,
  reputation_score: mol.Uint64LE,
  metadata: mol.String
});

function simulateCkbVmValidation(rawCellDataBytes) {
  console.log(`\n-> Ingesting Cell Data (${rawCellDataBytes.length} bytes)...`);

  // Syscall check 1: minimum table header length
  if (rawCellDataBytes.length < 4) {
    console.log(`   [Syscall Exit 3]: LengthNotEnough`);
    return 3;
  }

  const buf = Buffer.from(rawCellDataBytes);
  const totalSize = buf.readUInt32LE(0);

  // Syscall check 2: total size validity
  if (totalSize !== rawCellDataBytes.length) {
    console.log(`   [Syscall Exit 4]: EncodingInvalid (Header totalSize=${totalSize} != DataLen=${rawCellDataBytes.length})`);
    return 4;
  }

  // Zero-copy extraction of field 0 (version)
  const offsetVersion = buf.readUInt32LE(4);
  const version = buf.readUInt32LE(offsetVersion);

  // Zero-copy extraction of field 2 (reputation_score)
  const offsetReputation = buf.readUInt32LE(12);
  const reputation = buf.readBigUInt64LE(offsetReputation);

  console.log(`   Direct pointer read: version=${version}, reputation=${reputation}`);

  // Invariant Rule: Version must be >= 1, reputation must be >= 100
  if (version === 0) {
    console.log(`   [Syscall Exit 5]: InvariantViolation (Version cannot be 0)`);
    return 5;
  }

  if (reputation < 100n) {
    console.log(`   [Syscall Exit 5]: InvariantViolation (Reputation below threshold: ${reputation} < 100)`);
    return 5;
  }

  console.log(`   [Syscall Exit 0]: SUCCESS (All state invariants satisfied)`);
  return 0;
}

function runScriptInspection() {
  console.log('CKB-VM Script Molecule Verification Simulation');
  console.log('----------------------------------------------');

  // Test Case A: Valid on-chain state
  console.log('[Test 1] Valid State Cell Data:');
  const validState = {
    version: 1,
    owner_lock_hash: '0x' + '99'.repeat(32),
    reputation_score: 500n,
    metadata: 'verified-builder-account'
  };
  const validBytes = CellStateTable.encode(validState);
  console.log(`Hex: 0x${bytesTo(validBytes.slice(0, 32), 'hex')}... [${validBytes.length} bytes]`);
  const exitCodeA = simulateCkbVmValidation(validBytes);

  // Test Case B: Invariant violation (Reputation score too low)
  console.log('\n[Test 2] State Violating Invariant (Reputation = 50 < 100):');
  const invalidState = {
    version: 1,
    owner_lock_hash: '0x' + '99'.repeat(32),
    reputation_score: 50n,
    metadata: 'unverified-account'
  };
  const invalidBytes = CellStateTable.encode(invalidState);
  const exitCodeB = simulateCkbVmValidation(invalidBytes);

  // Test Case C: Corrupted byte length header
  console.log('\n[Test 3] Tampered Binary Payload (Corrupted Header):');
  const tamperedBytes = new Uint8Array(validBytes);
  tamperedBytes[0] = 0xff; // Corrupt total size byte
  const exitCodeC = simulateCkbVmValidation(tamperedBytes);

  console.log('\nSummary of Verification Runs:');
  console.log(`  Test 1 Exit Code: ${exitCodeA} (Expected 0)`);
  console.log(`  Test 2 Exit Code: ${exitCodeB} (Expected 5)`);
  console.log(`  Test 3 Exit Code: ${exitCodeC} (Expected 4)`);
}

runScriptInspection();
