/**
 * Types and interfaces for AgentBounty Fiber Hold Invoice Engine and AI Worker
 */

export type HoldInvoiceStatus = 'OPEN' | 'HELD' | 'SETTLED' | 'CANCELLED';

export type TaskCategory = 'CODE_AUDIT' | 'RESEARCH' | 'DATA_EXTRACTION';

export interface HoldInvoice {
  id: string;
  paymentHash: string; // 32-byte hex (SHA-256(preimage))
  preimage: string | null; // 32-byte hex revealed upon task completion
  amountCkb: number;
  taskId: string;
  creatorPubkey: string;
  workerPubkey: string | null;
  status: HoldInvoiceStatus;
  createdAt: number;
  timeoutSeconds: number;
  settledAt: number | null;
}

export interface BountyTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  prompt: string;
  rewardCkb: number;
  creator: string;
  invoiceId: string;
  paymentHash: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  resultArtifact: string | null;
  completedBy: string | null;
}

export interface FiberChannelState {
  channelId: string;
  creatorBalanceCkb: number;
  workerBalanceCkb: number;
  totalCapacityCkb: number;
  totalSettledCount: number;
  totalVolumeCkb: number;
}

export interface AIExecutionResult {
  analysis: string;
  modelUsed: string;
  tokensConsumed: number;
  executionDurationMs: number;
  proofPreimage: string; // 32-byte hex
  paymentHash: string; // SHA-256(proofPreimage)
}
