import crypto from 'crypto';
import { BountyTask, HoldInvoice, ChannelStats } from './types';

// Global singleton in memory for the Next.js dev server session
class FiberStore {
  private bounties: Map<string, BountyTask> = new Map();
  private invoices: Map<string, HoldInvoice> = new Map();
  private channel: ChannelStats = {
    channelId: 'fnn_chan_e8910b2d4fa6',
    creatorBalanceCkb: 5000,
    workerBalanceCkb: 350,
    totalCapacityCkb: 5350,
    settledCount: 1,
    totalVolumeCkb: 500,
  };

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Add one verified starter bounty
    const samplePreimage = '7a91bf503920ad1c00223efc91b5c899124018ad52c1ef900b1624c965719ef1';
    const sampleHash = crypto.createHash('sha256').update(Buffer.from(samplePreimage, 'hex')).digest('hex');

    const inv1: HoldInvoice = {
      id: 'fnn_inv_seed001',
      paymentHash: sampleHash,
      preimage: samplePreimage,
      amountCkb: 500,
      taskId: 'task_seed_01',
      creatorPubkey: 'ckb1_creator_alice',
      workerPubkey: 'ckb1_autonomous_agent_01',
      status: 'SETTLED',
      createdAt: Date.now() - 3600000,
      settledAt: Date.now() - 3590000,
    };
    this.invoices.set(inv1.id, inv1);

    const task1: BountyTask = {
      id: 'task_seed_01',
      title: 'CKB simple-guard Script Vulnerability Assessment',
      description: 'Audit bare-metal RISC-V contract simple-guard for capacity overflow and witness deserialization bugs.',
      category: 'CODE_AUDIT',
      prompt: 'Analyze simple-guard contract for capacity conservation and script args validation.',
      rewardCkb: 500,
      creator: 'ckb1_creator_alice',
      invoiceId: inv1.id,
      paymentHash: sampleHash,
      status: 'COMPLETED',
      resultArtifact: `### 🛡️ Security Audit Report: simple-guard Contract\n- **Status**: PASSED with 0 Critical Vulnerabilities\n- **Capacity Check**: Properly uses QueryIter to sum inputs & outputs.\n- **Binary Footprint**: 13 KB stripped RISC-V binary.\n- **Recommendation**: Ensure witness args boundary checking is enforced in all unlock paths.`,
      completedBy: 'Autonomous Sentinel Node',
      createdAt: Date.now() - 3600000,
    };
    this.bounties.set(task1.id, task1);
  }

  public getChannel(): ChannelStats {
    return { ...this.channel };
  }

  public getBounties(): BountyTask[] {
    return Array.from(this.bounties.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  public getInvoices(): HoldInvoice[] {
    return Array.from(this.invoices.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  public getBounty(id: string): BountyTask | undefined {
    return this.bounties.get(id);
  }

  public createBounty(
    title: string,
    description: string,
    category: BountyTask['category'],
    prompt: string,
    rewardCkb: number,
    creator: string,
    paymentHash: string
  ): BountyTask {
    if (this.channel.creatorBalanceCkb < rewardCkb) {
      throw new Error(`Insufficient channel capacity. Required: ${rewardCkb} CKB, Available: ${this.channel.creatorBalanceCkb} CKB`);
    }

    // Immediately escrow reward capacity from creator's available channel balance
    this.channel.creatorBalanceCkb -= rewardCkb;

    const taskId = `task_${Date.now().toString(36)}`;
    const invoiceId = `fnn_inv_${crypto.randomBytes(6).toString('hex')}`;

    const invoice: HoldInvoice = {
      id: invoiceId,
      paymentHash: paymentHash.toLowerCase(),
      preimage: null,
      amountCkb: rewardCkb,
      taskId,
      creatorPubkey: creator,
      workerPubkey: null,
      status: 'OPEN',
      createdAt: Date.now(),
      settledAt: null,
    };

    const task: BountyTask = {
      id: taskId,
      title,
      description,
      category,
      prompt,
      rewardCkb,
      creator,
      invoiceId,
      paymentHash,
      status: 'OPEN',
      resultArtifact: null,
      completedBy: null,
      createdAt: Date.now(),
    };

    this.invoices.set(invoiceId, invoice);
    this.bounties.set(taskId, task);

    return task;
  }

  public lockInvoice(invoiceId: string, workerPubkey = 'ckb1_sentinel_worker'): void {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status !== 'OPEN') throw new Error(`Invoice not open: ${invoice.status}`);

    // Mark as HELD in HTLC escrow (capacity was already isolated at creation)
    invoice.status = 'HELD';
    invoice.workerPubkey = workerPubkey;

    const task = this.bounties.get(invoice.taskId);
    if (task) task.status = 'IN_PROGRESS';
  }

  public settleInvoice(invoiceId: string, preimage: string, analysis: string, workerName: string): { durationMs: number } {
    const startTime = Date.now();
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status !== 'HELD') throw new Error(`Invoice not in HELD status`);

    // Verify SHA-256(preimage) == invoice.paymentHash
    const cleanPreimage = preimage.trim().toLowerCase();
    const computedHash = crypto.createHash('sha256').update(Buffer.from(cleanPreimage, 'hex')).digest('hex');

    if (computedHash !== invoice.paymentHash.toLowerCase()) {
      throw new Error(`Cryptographic Preimage mismatch! Hash verification failed.`);
    }

    // Transfer held funds to Worker
    invoice.preimage = cleanPreimage;
    invoice.status = 'SETTLED';
    invoice.settledAt = Date.now();

    this.channel.workerBalanceCkb += invoice.amountCkb;
    this.channel.settledCount += 1;
    this.channel.totalVolumeCkb += invoice.amountCkb;

    const task = this.bounties.get(invoice.taskId);
    if (task) {
      task.status = 'COMPLETED';
      task.resultArtifact = analysis;
      task.completedBy = workerName;
    }

    return { durationMs: Date.now() - startTime };
  }

  public cancelInvoice(invoiceId: string): void {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'SETTLED') throw new Error('Cannot cancel settled invoice');

    if (invoice.status === 'OPEN' || invoice.status === 'HELD') {
      this.channel.creatorBalanceCkb += invoice.amountCkb;
    }

    invoice.status = 'CANCELLED';
    const task = this.bounties.get(invoice.taskId);
    if (task) task.status = 'CANCELLED';
  }
}

// Global variable ensures persistence across hot reloads in Next.js development
const globalForFiber = globalThis as unknown as { fiberStore: FiberStore };
export const fiberStore = globalForFiber.fiberStore || new FiberStore();
if (process.env.NODE_ENV !== 'production') globalForFiber.fiberStore = fiberStore;
