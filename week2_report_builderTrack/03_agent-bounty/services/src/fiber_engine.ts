import * as crypto from 'crypto';
import { HoldInvoice, FiberChannelState, HoldInvoiceStatus } from './types';

export class FiberHoldInvoiceEngine {
  private invoices: Map<string, HoldInvoice> = new Map();
  private channelState: FiberChannelState;

  constructor(initialCreatorBalanceCkb = 5000, initialWorkerBalanceCkb = 200) {
    this.channelState = {
      channelId: `fnn_chan_${crypto.randomBytes(8).toString('hex')}`,
      creatorBalanceCkb: initialCreatorBalanceCkb,
      workerBalanceCkb: initialWorkerBalanceCkb,
      totalCapacityCkb: initialCreatorBalanceCkb + initialWorkerBalanceCkb,
      totalSettledCount: 0,
      totalVolumeCkb: 0,
    };
  }

  public getChannelState(): FiberChannelState {
    return { ...this.channelState };
  }

  public getAllInvoices(): HoldInvoice[] {
    return Array.from(this.invoices.values());
  }

  public getInvoice(invoiceId: string): HoldInvoice | undefined {
    return this.invoices.get(invoiceId);
  }

  /**
   * 1. Create an OPEN Hold Invoice linked to a target task and payment hash
   */
  public createHoldInvoice(
    taskId: string,
    amountCkb: number,
    paymentHash: string,
    creatorPubkey = 'ckb1_creator_node',
    timeoutSeconds = 300
  ): HoldInvoice {
    if (this.channelState.creatorBalanceCkb < amountCkb) {
      throw new Error(
        `Insufficient Fiber channel balance. Required: ${amountCkb} CKB, Available: ${this.channelState.creatorBalanceCkb} CKB`
      );
    }

    const invoiceId = `fnn_inv_${crypto.randomBytes(6).toString('hex')}`;
    const invoice: HoldInvoice = {
      id: invoiceId,
      paymentHash: paymentHash.toLowerCase(),
      preimage: null,
      amountCkb,
      taskId,
      creatorPubkey,
      workerPubkey: null,
      status: 'OPEN',
      createdAt: Date.now(),
      timeoutSeconds,
      settledAt: null,
    };

    this.invoices.set(invoiceId, invoice);
    console.log(`[FiberEngine] Created Hold Invoice ${invoiceId} | Amount: ${amountCkb} CKB | Hash: ${paymentHash.slice(0, 10)}...`);
    return invoice;
  }

  /**
   * 2. Lock Hold Invoice in the channel when an AI Worker accepts the task
   */
  public lockHoldInvoice(invoiceId: string, workerPubkey = 'ckb1_ai_worker_node'): HoldInvoice {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      throw new Error(`Hold Invoice ${invoiceId} not found`);
    }

    if (invoice.status !== 'OPEN') {
      throw new Error(`Cannot lock invoice in status ${invoice.status}`);
    }

    if (this.channelState.creatorBalanceCkb < invoice.amountCkb) {
      throw new Error(`Channel capacity insufficient to lock ${invoice.amountCkb} CKB`);
    }

    // Isolate/hold capacity from Creator into HTLC escrow
    this.channelState.creatorBalanceCkb -= invoice.amountCkb;
    invoice.workerPubkey = workerPubkey;
    invoice.status = 'HELD';

    console.log(`[FiberEngine] Locked Hold Invoice ${invoiceId} in channel HTLC. Status: HELD`);
    return invoice;
  }

  /**
   * 3. Settle Hold Invoice upon receiving valid cryptographic preimage
   */
  public settleHoldInvoice(invoiceId: string, preimage: string): { invoice: HoldInvoice; durationMs: number } {
    const startTime = Date.now();
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      throw new Error(`Hold Invoice ${invoiceId} not found`);
    }

    if (invoice.status !== 'HELD') {
      throw new Error(`Invoice must be in HELD status to settle. Current: ${invoice.status}`);
    }

    // Verify SHA-256(preimage) == paymentHash
    const cleanPreimage = preimage.trim().toLowerCase();
    const computedHash = crypto
      .createHash('sha256')
      .update(Buffer.from(cleanPreimage, 'hex'))
      .digest('hex');

    if (computedHash !== invoice.paymentHash) {
      throw new Error(
        `Cryptographic Preimage mismatch! Computed SHA-256: ${computedHash}, Expected: ${invoice.paymentHash}`
      );
    }

    // Release held funds into Worker balance
    invoice.preimage = cleanPreimage;
    invoice.status = 'SETTLED';
    invoice.settledAt = Date.now();

    this.channelState.workerBalanceCkb += invoice.amountCkb;
    this.channelState.totalSettledCount += 1;
    this.channelState.totalVolumeCkb += invoice.amountCkb;

    const durationMs = Date.now() - startTime;
    console.log(
      `[FiberEngine]  Settled Hold Invoice ${invoiceId}! Worker credited ${invoice.amountCkb} CKB in ${durationMs}ms (0 Gas).`
    );

    return { invoice, durationMs };
  }

  /**
   * 4. Cancel Hold Invoice (e.g. timeout or rejected execution) and refund Creator
   */
  public cancelHoldInvoice(invoiceId: string, reason = 'Timeout / Cancellation'): HoldInvoice {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      throw new Error(`Hold Invoice ${invoiceId} not found`);
    }

    if (invoice.status === 'SETTLED') {
      throw new Error(`Cannot cancel an already SETTLED invoice`);
    }

    if (invoice.status === 'HELD') {
      // Refund held capacity back to creator
      this.channelState.creatorBalanceCkb += invoice.amountCkb;
    }

    invoice.status = 'CANCELLED';
    console.log(`[FiberEngine] Cancelled Hold Invoice ${invoiceId}. Reason: ${reason}. Capacity refunded.`);
    return invoice;
  }
}
