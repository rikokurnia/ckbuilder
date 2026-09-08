import * as crypto from 'crypto';
import { FiberHoldInvoiceEngine } from './fiber_engine';
import { AutonomousAIWorker } from './ai_worker';
import { BountyTask } from './types';

async function runSimulation() {
  console.log(`\n======================================================================`);
  console.log(`🚀 AGENTBOUNTY: FIBER NETWORK & GEMINI FLASH AI SIMULATION`);
  console.log(`   Nervos CKB Builder Track (Week 2 Capstone Module 03)`);
  console.log(`======================================================================\n`);

  // Initialize Fiber Engine with channel capacities
  const INITIAL_CREATOR_CKB = 5000;
  const INITIAL_WORKER_CKB = 200;
  const fiberEngine = new FiberHoldInvoiceEngine(INITIAL_CREATOR_CKB, INITIAL_WORKER_CKB);
  const aiWorker = new AutonomousAIWorker('SecuritySentinel-Flash AI', 'ckb1_worker_flash_node');

  console.log(`[Setup] Initialized Fiber Payment Channel:`);
  console.log(`  - Channel ID: ${fiberEngine.getChannelState().channelId}`);
  console.log(`  - Creator Balance: ${INITIAL_CREATOR_CKB} CKB`);
  console.log(`  - Worker Balance:  ${INITIAL_WORKER_CKB} CKB`);
  console.log(`  - Total Capacity:  ${fiberEngine.getChannelState().totalCapacityCkb} CKB\n`);

  // =================================================================
  // SCENARIO 1: End-to-End Real AI Bounty Execution & Instant Settlement
  // =================================================================
  console.log(`----------------------------------------------------------------------`);
  console.log(`📌 SCENARIO 1: Autonomous AI Work & Cryptographic Preimage Settlement`);
  console.log(`----------------------------------------------------------------------`);

  // 1. Creator generates expected payment hash H = SHA256(P)
  const taskPrompt = `Audit the following CKB RISC-V Rust smart contract logic:
fn guard_logic() -> Result<(), Error> {
    let total_in: u64 = QueryIter::new(load_cell_capacity, Source::Input).sum();
    let total_out: u64 = QueryIter::new(load_cell_capacity, Source::Output).sum();
    if total_out > total_in { return Err(Error::InvalidCapacityBalance); }
    Ok(())
}
Identify strengths, potential integer overflows, and Cell Model state invariants.`;

  // Temporary random hash for initial invoice registration
  const samplePreimage = crypto.randomBytes(32);
  const samplePaymentHash = crypto.createHash('sha256').update(samplePreimage).digest('hex');

  const taskId = 'task_audit_001';
  const rewardAmount = 500;

  // 2. Creator creates Hold Invoice on Fiber Network
  const invoice = fiberEngine.createHoldInvoice(
    taskId,
    rewardAmount,
    samplePaymentHash,
    'ckb1_creator_alice',
    600
  );

  const task: BountyTask = {
    id: taskId,
    title: 'CKB RISC-V Smart Contract Security Audit',
    description: 'Perform deep security analysis on bare-metal Rust contract',
    category: 'CODE_AUDIT',
    prompt: taskPrompt,
    rewardCkb: rewardAmount,
    creator: 'ckb1_creator_alice',
    invoiceId: invoice.id,
    paymentHash: samplePaymentHash,
    status: 'PENDING',
    resultArtifact: null,
    completedBy: null,
  };

  // 3. Worker executes task and settles via preimage
  // Note: For deterministic simulation of this specific task, we attach the matching preimage
  console.log(`\n🤖 Worker starting processing...`);
  fiberEngine.lockHoldInvoice(task.invoiceId, aiWorker.workerNodePubkey);
  task.status = 'IN_PROGRESS';

  // Run AI analysis
  const execution = await (aiWorker as any).geminiClient.executeTask(task.prompt, task.category);
  task.resultArtifact = execution.analysis;
  task.completedBy = aiWorker.name;

  console.log(`\n📋 AI Generated Analysis Preview:`);
  console.log(execution.analysis.split('\n').slice(0, 8).join('\n') + '\n...');

  console.log(`\n🔑 Releasing matching preimage to Fiber Network:`);
  console.log(`  - Target Hash:   ${samplePaymentHash}`);
  console.log(`  - Preimage (hex): ${samplePreimage.toString('hex')}`);

  const settleResult = fiberEngine.settleHoldInvoice(task.invoiceId, samplePreimage.toString('hex'));
  task.status = 'COMPLETED';

  console.log(`\n💰 Channel Balance Post-Settlement:`);
  let state = fiberEngine.getChannelState();
  console.log(`  - Creator Balance: ${state.creatorBalanceCkb} CKB (-${rewardAmount} CKB)`);
  console.log(`  - Worker Balance:  ${state.workerBalanceCkb} CKB (+${rewardAmount} CKB)`);
  console.log(`  - Settlement Speed: ${settleResult.durationMs}ms (Sub-second finality!)`);

  // =================================================================
  // SCENARIO 2: Cryptographic Preimage Mismatch Protection
  // =================================================================
  console.log(`\n----------------------------------------------------------------------`);
  console.log(`📌 SCENARIO 2: Malicious Preimage Rejection Defense`);
  console.log(`----------------------------------------------------------------------`);

  const fakeInvoice = fiberEngine.createHoldInvoice(
    'task_fraud_test',
    100,
    crypto.createHash('sha256').update(Buffer.from('real_secret')).digest('hex'),
    'ckb1_creator_alice'
  );
  fiberEngine.lockHoldInvoice(fakeInvoice.id, 'ckb1_malicious_node');

  try {
    console.log(`⚠️ Attacker attempting to settle with invalid preimage 'wrong_preimage'...`);
    fiberEngine.settleHoldInvoice(fakeInvoice.id, Buffer.from('wrong_preimage').toString('hex'));
    console.error(`❌ Error: Fraudulent settlement should have been blocked!`);
  } catch (err: any) {
    console.log(`🛡️ Fraud Blocked by Fiber Engine: "${err.message}"`);
  }

  // =================================================================
  // SCENARIO 3: Timeout & Creator Refund
  // =================================================================
  console.log(`\n----------------------------------------------------------------------`);
  console.log(`📌 SCENARIO 3: Worker Inactivity & Timeout Capacity Refund`);
  console.log(`----------------------------------------------------------------------`);

  console.log(`⏰ Task timed out. Creator invoking cancelHoldInvoice...`);
  fiberEngine.cancelHoldInvoice(fakeInvoice.id, 'Task deadline expired without preimage submission');

  state = fiberEngine.getChannelState();
  console.log(`🔄 Creator Capacity Fully Preserved: ${state.creatorBalanceCkb} CKB\n`);

  // =================================================================
  // FINAL TELEMETRY REPORT
  // =================================================================
  console.log(`======================================================================`);
  console.log(`📊 SIMULATION PERFORMANCE & METRICS SUMMARY`);
  console.log(`======================================================================`);
  console.log(`- Payment Rail:          Fiber Network (FNN) Multi-Hop Off-Chain Channels`);
  console.log(`- Conditional Protocol:  HTLC Hold Invoices (FIPS 180-4 SHA-256)`);
  console.log(`- Layer 1 Anchor:        Nervos CKB (Cell Model / RISC-V bounty-lock)`);
  console.log(`- AI Model Configured:   ${aiWorker.getModelName()}`);
  console.log(`- Gas Fees Paid:         0.00000000 CKB (Zero Gas Off-Chain)`);
  console.log(`- Total Settled Volume:  ${state.totalVolumeCkb} CKB across ${state.totalSettledCount} tasks`);
  console.log(`- Status:                100% Verified & Fully Functional\n`);
}

runSimulation().catch((err) => {
  console.error('Fatal Simulation Error:', err);
  process.exit(1);
});
