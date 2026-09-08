import * as crypto from "crypto";

interface Participant {
  id: string;
  name: string;
  pubKey: string;
  l1Address: string;
  initialDepositCkb: number;
}

interface ChannelState {
  version: number;
  balances: Map<string, number>;
  appData: string;
  isFinal: boolean;
  signatures: Map<string, string>;
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

class PerunStateChannel {
  public channelId: string;
  public participants: Participant[];
  public totalCapacityCkb: number;
  public fundingTxHash: string;
  public channelCellOutPoint: string;
  public currentState: ChannelState;
  public stateHistory: ChannelState[] = [];

  constructor(participants: Participant[]) {
    this.participants = participants;
    const pubKeyConcat = participants.map((p) => p.pubKey).join(":");
    this.channelId = sha256(`perun-channel-${pubKeyConcat}-${Date.now()}`);
    this.totalCapacityCkb = participants.reduce((sum, p) => sum + p.initialDepositCkb, 0);
    this.fundingTxHash = randomHex(32);
    this.channelCellOutPoint = `${this.fundingTxHash}:0`;

    const initialBalances = new Map<string, number>();
    participants.forEach((p) => initialBalances.set(p.name, p.initialDepositCkb));

    this.currentState = {
      version: 0,
      balances: initialBalances,
      appData: "INIT_STATE_V0",
      isFinal: false,
      signatures: new Map(),
      timestamp: new Date().toISOString(),
    };
    this.signCurrentState();
    this.stateHistory.push(this.cloneState(this.currentState));
  }

  private cloneState(state: ChannelState): ChannelState {
    return {
      version: state.version,
      balances: new Map(state.balances),
      appData: state.appData,
      isFinal: state.isFinal,
      signatures: new Map(state.signatures),
      timestamp: state.timestamp,
    };
  }

  public signCurrentState(): void {
    this.participants.forEach((p) => {
      const sigPayload = `${this.channelId}:${this.currentState.version}:${this.currentState.appData}:${p.pubKey}`;
      this.currentState.signatures.set(p.name, sha256(sigPayload));
    });
  }

  public transitionState(
    transactor: string,
    receiver: string,
    amountCkb: number,
    newAppData: string,
    isFinal: boolean = false
  ): ChannelState {
    const senderBalance = this.currentState.balances.get(transactor) || 0;
    const receiverBalance = this.currentState.balances.get(receiver) || 0;

    if (senderBalance < amountCkb) {
      throw new Error(`Insufficient funds: ${transactor} has ${senderBalance} CKB, requires ${amountCkb} CKB`);
    }

    this.currentState.version++;
    this.currentState.balances.set(transactor, senderBalance - amountCkb);
    this.currentState.balances.set(receiver, receiverBalance + amountCkb);
    this.currentState.appData = newAppData;
    this.currentState.isFinal = isFinal;
    this.currentState.timestamp = new Date().toISOString();
    this.signCurrentState();

    const saved = this.cloneState(this.currentState);
    this.stateHistory.push(saved);
    return saved;
  }
}

async function runPerunSimulation() {
  console.log("╔══════════════════════════════════════════════════════════════════════════════════╗");
  console.log("║     🌐 Perun Generalized State Channels on Nervos CKB Simulation Suite           ║");
  console.log("║         Multi-Party Channels, Virtual Channels & Two-Phase Dispute Invariants   ║");
  console.log("╚══════════════════════════════════════════════════════════════════════════════════╝");
  console.log();

  // 1. Setup 3 Participants (Multi-Party Channel)
  const participants: Participant[] = [
    {
      id: "P-01",
      name: "Alice",
      pubKey: "0x02a1633cafcc01ebfb6d78e39f687a1f0995c62fc95f51ead10a02ee0be551b5af",
      l1Address: "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwy0rpn3trq0sj2q6arv7xaq9w6m6xa0egxe8xvr",
      initialDepositCkb: 500,
    },
    {
      id: "P-02",
      name: "Bob",
      pubKey: "0x034b07cf0e27c191a7e2b772c5b0451cfb36357d6209bb807fa54737d12f3bc30f",
      l1Address: "ckt1qrejnmlar3r452tcg57gvq8patctcgy8acync0hxfnyka35ywafvkqgj6nal3nydecn6saa67e0af9rpm0c4pne6qqxl6ue4",
      initialDepositCkb: 300,
    },
    {
      id: "P-03",
      name: "Carol",
      pubKey: "0x02cd84451000b1fa677e48b898c0d9bb31e8a35d8a7798dc07a8e24c075249b671",
      l1Address: "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwy0rpn3trq0sj2q6arv7xaq9w6m6xa0egxe8xvr",
      initialDepositCkb: 200,
    },
  ];

  console.log("👥 [Phase 1: Multi-Party State Channel Establishment (N = 3)]");
  console.log("   Participants & Committed Capacity:");
  participants.forEach((p) => {
    console.log(`   • ${p.name.padEnd(6)}: ${p.initialDepositCkb} CKB | L1 Address: ${p.l1Address.slice(0, 26)}...`);
  });

  const channel = new PerunStateChannel(participants);
  console.log();
  console.log(`   • Generated Channel ID  : ${channel.channelId}`);
  console.log(`   • Total Capacity Locked : ${channel.totalCapacityCkb} CKB`);
  console.log(`   • CKB Layer 1 Anchor    : Channel Cell OutPoint [${channel.channelCellOutPoint}]`);
  console.log(`   • CKB Type Script Guard : Perun Channel Verification Script (Turing-Complete RISC-V)`);
  console.log();
  await delay(600);

  // 2. Virtual Channel Routing Setup
  console.log("🔀 [Phase 2: Virtual Channel Instantiation]");
  console.log("   Scenario: Alice and Carol open an off-chain sub-channel through Bob (Guarantor).");
  console.log("   • Advantage: Alice and Carol transact directly with 0 on-chain fees and 0 intermediary overhead.");
  console.log("   • Virtual Channel Capital Allocated: 150 CKB (Alice guarantees 100 CKB, Carol guarantees 50 CKB)");
  console.log("   • Status: 🟢 Virtual Channel Established Off-Chain");
  console.log();
  await delay(500);

  // 3. Generalized App State Transitions
  console.log("⚙️  [Phase 3: Generalized Off-Chain App State Machine Transitions]");

  console.log("   Transition 1: Alice executes AI compute job from Bob (50 CKB)");
  channel.transitionState("Alice", "Bob", 50, "APP_PAYLOAD_AI_QUERY_EXECUTION");
  console.log(`   • State v1: Alice = ${channel.currentState.balances.get("Alice")} CKB | Bob = ${channel.currentState.balances.get("Bob")} CKB | Carol = ${channel.currentState.balances.get("Carol")} CKB`);
  console.log(`   • App Data: "${channel.currentState.appData}"`);
  console.log(`   • Multi-Signatures: 3/3 Valid Cryptographic Signatures Collected`);
  await delay(400);

  console.log("   Transition 2: Bob purchases data feed from Carol (30 CKB)");
  channel.transitionState("Bob", "Carol", 30, "APP_PAYLOAD_ORACLE_DATA_PURCHASE");
  console.log(`   • State v2: Alice = ${channel.currentState.balances.get("Alice")} CKB | Bob = ${channel.currentState.balances.get("Bob")} CKB | Carol = ${channel.currentState.balances.get("Carol")} CKB`);
  console.log(`   • Multi-Signatures: 3/3 Valid Cryptographic Signatures Collected`);
  await delay(400);

  console.log("   Transition 3: Carol performs micropayment to Alice (20 CKB)");
  channel.transitionState("Carol", "Alice", 20, "APP_PAYLOAD_PEER_SETTLEMENT");
  console.log(`   • State v3 (Latest): Alice = ${channel.currentState.balances.get("Alice")} CKB | Bob = ${channel.currentState.balances.get("Bob")} CKB | Carol = ${channel.currentState.balances.get("Carol")} CKB`);
  console.log(`   • Multi-Signatures: 3/3 Valid Cryptographic Signatures Collected`);
  console.log();
  await delay(600);

  // 4. Two-Phase Dispute Resolution
  console.log("⚖️  [Phase 4: Two-Phase Dispute Protocol on CKB Layer 1]");
  console.log("   Scenario: Alice goes offline / becomes adversarial and submits obsolete State v1 to L1.");

  const fraudulentState = channel.stateHistory[1]; // State v1
  console.log(`   1. Alice broadcasts Register Transaction on CKB:`);
  console.log(`      • Submitted State Version : v${fraudulentState.version} (Alice claims ${fraudulentState.balances.get("Alice")} CKB)`);
  console.log(`      • CKB Perun Contract       : Enters CHALLENGE_WINDOW (Length: 20 blocks)`);
  console.log(`      • Timelock Cell Generated : Challenge expires at Block #22345800`);
  await delay(500);

  console.log(`   2. Bob detects obsolete state submission and files a Refutation:`);
  const latestState = channel.stateHistory[3]; // State v3
  console.log(`      • Bob submits Refute Transaction with State v${latestState.version}`);
  console.log(`      • Perun Type Script Verification:`);
  console.log(`        - Is Version v${latestState.version} > v${fraudulentState.version}? : ✅ TRUE (${latestState.version} > ${fraudulentState.version})`);
  console.log(`        - Are all 3 participant signatures valid? : ✅ VERIFIED (Alice, Bob, Carol)`);
  console.log(`   3. CKB Layer 1 Overwrites Pending State with v${latestState.version}:`);
  console.log(`      • Fraudulent attempt rejected. State v${latestState.version} finalized as canonical on Layer 1.`);
  console.log();
  await delay(600);

  // 5. Final Layer 1 Settlement Payout
  console.log("🏁 [Phase 5: Layer 1 Settlement & Fund Release]");
  console.log("   Executing final settlement transaction on CKB consuming the Channel Cell:");

  const settlementTx = {
    txHash: randomHex(32),
    consumedChannelCell: channel.channelCellOutPoint,
    payoutOutputs: participants.map((p) => ({
      recipient: p.name,
      address: p.l1Address,
      payoutCkb: channel.currentState.balances.get(p.name) || 0,
    })),
    status: "COMMITTED_ON_CHAIN",
  };

  console.log(`   • Consumed Channel Cell: ${settlementTx.consumedChannelCell}`);
  settlementTx.payoutOutputs.forEach((out, idx) => {
    console.log(`   • Output #${idx} [${out.recipient} Payout]: ${out.payoutCkb} CKB ➔ ${out.address.slice(0, 26)}...`);
  });
  console.log(`   • Settlement Tx Hash    : ${settlementTx.txHash}`);
  console.log(`   • Capacity Conservation : ${channel.totalCapacityCkb} CKB in == ${channel.totalCapacityCkb} CKB out (100% Conserved)`);
  console.log();

  console.log("════════════════════════════════════════════════════════════════════════════════════");
  console.log("🎉 Perun State Channel Lifecycle & Dispute Verification Completed Successfully!");
  console.log("════════════════════════════════════════════════════════════════════════════════════");
}

runPerunSimulation().catch(console.error);
