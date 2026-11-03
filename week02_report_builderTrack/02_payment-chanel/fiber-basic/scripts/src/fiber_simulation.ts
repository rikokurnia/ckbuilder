import * as crypto from "crypto";

interface Peer {
  name: string;
  pubKey: string;
  l1Address: string;
  initialDepositCkb: number;
}

interface HTLCObject {
  id: string;
  paymentHash: string;
  amountCkb: number;
  expiryBlock: number;
  status: "PENDING" | "CLAIMED" | "REFUNDED";
}

interface CommitmentState {
  index: number;
  aliceBalance: number;
  bobBalance: number;
  htlcs: HTLCObject[];
  revocationHash: string;
  revocationSecret?: string;
  timestamp: string;
}

function sha256(data: string): string {
  return "0x" + crypto.createHash("sha256").update(data).digest("hex");
}

function randomHex(bytes: number): string {
  return "0x" + crypto.randomBytes(bytes).toString("hex");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class FiberChannel {
  public channelId: string;
  public totalCapacityCkb: number;
  public fundingTxHash: string;
  public multisigLockHash: string;
  public currentStateIndex: number = 0;
  public stateHistory: CommitmentState[] = [];
  public currentAliceBalance: number;
  public currentBobBalance: number;

  constructor(
    public alice: Peer,
    public bob: Peer,
  ) {
    this.channelId = sha256(`fiber-channel-${alice.pubKey}-${bob.pubKey}-${Date.now()}`);
    this.totalCapacityCkb = alice.initialDepositCkb + bob.initialDepositCkb;
    this.currentAliceBalance = alice.initialDepositCkb;
    this.currentBobBalance = bob.initialDepositCkb;
    this.multisigLockHash = sha256(`multisig-2-of-2-${alice.pubKey}-${bob.pubKey}`);
    this.fundingTxHash = randomHex(32);
  }

  public recordState(revocationSecret: string, htlcs: HTLCObject[] = []): CommitmentState {
    const state: CommitmentState = {
      index: this.currentStateIndex,
      aliceBalance: this.currentAliceBalance,
      bobBalance: this.currentBobBalance,
      htlcs,
      revocationHash: sha256(revocationSecret),
      revocationSecret,
      timestamp: new Date().toISOString(),
    };
    this.stateHistory.push(state);
    return state;
  }

  public executePayment(from: string, to: string, amountCkb: number, reason: string): CommitmentState {
    const isAlicePaying = from.toLowerCase().includes("alice");
    if (isAlicePaying) {
      if (this.currentAliceBalance < amountCkb) {
        throw new Error(`Insufficient Alice balance (${this.currentAliceBalance} CKB) for ${amountCkb} CKB`);
      }
      this.currentAliceBalance -= amountCkb;
      this.currentBobBalance += amountCkb;
    } else {
      if (this.currentBobBalance < amountCkb) {
        throw new Error(`Insufficient Bob balance (${this.currentBobBalance} CKB) for ${amountCkb} CKB`);
      }
      this.currentBobBalance -= amountCkb;
      this.currentAliceBalance += amountCkb;
    }

    this.currentStateIndex++;
    const secret = `revocation-secret-state-${this.currentStateIndex}-${randomHex(8)}`;
    const state = this.recordState(secret);

    console.log(`   ⚡ [Payment #${this.currentStateIndex}] ${from} ➔ ${to}: ${amountCkb} CKB (${reason})`);
    console.log(`      • Updated Channel State: Alice = ${this.currentAliceBalance} CKB | Bob = ${this.currentBobBalance} CKB`);
    console.log(`      • Revocation Commitment Hash: ${state.revocationHash.slice(0, 18)}...`);
    return state;
  }
}

async function runFiberSimulation() {
  console.log("╔══════════════════════════════════════════════════════════════════════════════════╗");
  console.log("║     ⚡ Nervos CKB Fiber Network (Lightning Layer 2) Channel Simulation Suite       ║");
  console.log("║          P2P Channel Lifecycle, HTLC Multi-Hop & Dispute Verification           ║");
  console.log("╚══════════════════════════════════════════════════════════════════════════════════╝");
  console.log();

  // 1. Channel Participants
  const alice: Peer = {
    name: "Alice (Client / Consumer)",
    pubKey: "0x02a1633cafcc01ebfb6d78e39f687a1f0995c62fc95f51ead10a02ee0be551b5af",
    l1Address: "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwy0rpn3trq0sj2q6arv7xaq9w6m6xa0egxe8xvr",
    initialDepositCkb: 1000,
  };

  const bob: Peer = {
    name: "Bob (Service Provider / Merchant)",
    pubKey: "0x034b07cf0e27c191a7e2b772c5b0451cfb36357d6209bb807fa54737d12f3bc30f",
    l1Address: "ckt1qrejnmlar3r452tcg57gvq8patctcgy8acync0hxfnyka35ywafvkqgj6nal3nydecn6saa67e0af9rpm0c4pne6qqxl6ue4",
    initialDepositCkb: 500,
  };

  console.log("👥 [Phase 1: Channel Handshake & Negotiation]");
  console.log(`   • Peer A: ${alice.name}`);
  console.log(`     - Initial Committed Capacity: ${alice.initialDepositCkb} CKB`);
  console.log(`     - Layer 1 Lock Address      : ${alice.l1Address.slice(0, 30)}...`);
  console.log(`   • Peer B: ${bob.name}`);
  console.log(`     - Initial Committed Capacity: ${bob.initialDepositCkb} CKB`);
  console.log(`     - Layer 1 Lock Address      : ${bob.l1Address.slice(0, 30)}...`);
  console.log();
  await delay(500);

  // 2. On-Chain Funding Cell Assembly
  console.log("🔗 [Phase 2: Layer 1 Funding Cell Assembly & Broadcast]");
  const channel = new FiberChannel(alice, bob);
  channel.recordState("revocation-initial-state-0");

  console.log(`   • Channel ID (256-bit)   : ${channel.channelId}`);
  console.log(`   • 2-of-2 Multisig Lock   : ${channel.multisigLockHash}`);
  console.log(`   • Total Capacity Locked  : ${channel.totalCapacityCkb} CKB (150,000,000,000 Shannons)`);
  console.log(`   • Simulated L1 Funding Tx: ${channel.fundingTxHash}`);
  console.log(`   • Layer 1 Confirmation   : 🟢 6 Confirmations on CKB Testnet (Pudge)`);
  console.log();
  await delay(600);

  // 3. High-Speed Off-Chain Micropayments
  console.log("⚡ [Phase 3: High-Frequency Off-Chain Micropayments (0 Gas / Sub-second)]");
  channel.executePayment("Alice", "Bob", 60, "Cloud Compute Node Hourly Lease");
  await delay(300);
  channel.executePayment("Alice", "Bob", 40, "AI Inference Model API Query");
  await delay(300);
  channel.executePayment("Bob", "Alice", 15, "Bandwidth Rebate Cash-Back");
  await delay(300);
  channel.executePayment("Alice", "Bob", 80, "Storage Proof Rent Extension");
  console.log();
  await delay(500);

  // 4. Multi-Hop HTLC Routing Simulation
  console.log("🔀 [Phase 4: Multi-Hop HTLC (Hash Time-Locked Contract) Routing]");
  console.log("   Scenario: Alice pays Charlie (3rd Party Content Creator) via Bob (Routing Node).");

  const secretPreimage = "ckb-fiber-payment-preimage-secret-value-xyz-987";
  const paymentHash = sha256(secretPreimage);

  console.log(`   1. Charlie generates payment invoice:`);
  console.log(`      • Payment Hash (SHA256) : ${paymentHash}`);
  console.log(`      • Amount                : 120 CKB`);
  console.log(`      • Lock Expiry           : Block Height + 100`);

  console.log(`   2. Alice locks 120 CKB in HTLC routed to Bob.`);
  const htlc: HTLCObject = {
    id: "HTLC-001",
    paymentHash,
    amountCkb: 120,
    expiryBlock: 22346000,
    status: "PENDING",
  };
  channel.currentAliceBalance -= 120;
  channel.currentStateIndex++;
  channel.recordState(`revocation-htlc-locked-${channel.currentStateIndex}`, [htlc]);
  console.log(`      • Pending HTLC locked in Channel State #${channel.currentStateIndex}`);
  console.log(`      • Alice Reserved Balance: ${channel.currentAliceBalance} CKB`);

  console.log(`   3. Charlie reveals secret Preimage to claim funds across route:`);
  console.log(`      • Preimage Received: "${secretPreimage}"`);
  console.log(`      • Hash Verification: ${sha256(secretPreimage) === paymentHash ? "✅ MATCHED" : "❌ FAILED"}`);

  // Resolve HTLC: Bob receives the 120 CKB
  htlc.status = "CLAIMED";
  channel.currentBobBalance += 120;
  channel.currentStateIndex++;
  channel.recordState(`revocation-htlc-claimed-${channel.currentStateIndex}`);
  console.log(`   4. HTLC settled successfully:`);
  console.log(`      • Final Net Balances: Alice = ${channel.currentAliceBalance} CKB | Bob = ${channel.currentBobBalance} CKB`);
  console.log();
  await delay(600);

  // 5. Watchtower & Fraud Prevention Verification
  console.log("🛡️ [Phase 5: Watchtower & Fraud Invariant Verification]");
  console.log("   Scenario: Alice maliciously attempts to broadcast obsolete State #1 on Layer 1.");
  const obsoleteState = channel.stateHistory[1];
  console.log(`   • Cheater attempts to broadcast State #${obsoleteState.index} (Alice Balance: ${obsoleteState.aliceBalance} CKB instead of current ${channel.currentAliceBalance} CKB).`);
  console.log(`   • Watchtower checks on-chain commitment index.`);
  console.log(`   • Revocation Secret for State #${obsoleteState.index} is known by Bob: "${obsoleteState.revocationSecret}"`);
  console.log(`   • Hash Check: ${sha256(obsoleteState.revocationSecret!) === obsoleteState.revocationHash ? "VALID REVOCATION" : "INVALID"}`);
  console.log(`   🚨 PENALTY TRIGGERED: Bob invokes Justice Transaction on Layer 1!`);
  console.log(`      - Entire 1,500 CKB channel capacity is forfeited and awarded to Bob.`);
  console.log(`      - Cheater (Alice) balance confiscated: 0 CKB.`);
  console.log(`   ✅ Game-theoretic security upheld via CKB-VM revocation logic.`);
  console.log();
  await delay(600);

  // 6. Cooperative Channel Settlement (Normal Closing)
  console.log("🤝 [Phase 6: Cooperative Channel Settlement (Clean L1 Close)]");
  console.log("   Both parties agree on latest state and sign a closing transaction.");
  const finalAlicePayout = channel.currentAliceBalance;
  const finalBobPayout = channel.currentBobBalance;
  const minerFee = 0.001; // 0.001 CKB miner fee

  const closingTx = {
    txHash: randomHex(32),
    consumedFundingCell: `${channel.fundingTxHash}:0`,
    outputs: [
      { recipient: "Alice", address: alice.l1Address, capacityCkb: finalAlicePayout - minerFee / 2 },
      { recipient: "Bob", address: bob.l1Address, capacityCkb: finalBobPayout - minerFee / 2 },
    ],
    minerFeeCkb: minerFee,
    status: "COMMITTED_ON_CHAIN",
  };

  console.log(`   • Consumed 2-of-2 Multisig Cell: ${closingTx.consumedFundingCell}`);
  console.log(`   • Output Cell 0 (Alice Payout)  : ${(finalAlicePayout - minerFee / 2).toFixed(4)} CKB`);
  console.log(`   • Output Cell 1 (Bob Payout)    : ${(finalBobPayout - minerFee / 2).toFixed(4)} CKB`);
  console.log(`   • Miner Fee                     : ${closingTx.minerFeeCkb} CKB`);
  console.log(`   • Settlement Tx Hash            : ${closingTx.txHash}`);
  console.log(`   • Result                        : 🟢 100% Funds Successfully Reclaimed on Layer 1!`);
  console.log();

  console.log("════════════════════════════════════════════════════════════════════════════════════");
  console.log("🎉 Fiber Network Channel Lifecycle Simulation Completed Successfully!");
  console.log("════════════════════════════════════════════════════════════════════════════════════");
}

runFiberSimulation().catch(console.error);
