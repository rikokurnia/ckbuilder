export type HoldInvoiceStatus = 'OPEN' | 'HELD' | 'SETTLED' | 'CANCELLED' | 'FAILED';

export type TaskCategory = 'CODE_AUDIT' | 'DEEP_RESEARCH' | 'DATA_EXTRACTION';

export interface HoldInvoice {
  id: string;
  paymentHash: string;
  preimage: string | null;
  amountCkb: number;
  taskId: string;
  creatorPubkey: string;
  workerPubkey: string | null;
  status: HoldInvoiceStatus;
  createdAt: number;
  settledAt: number | null;
  nativeInvoiceId?: string | null;
  nativeInvoiceState?: string | null;
  nativePaymentState?: string | null;
  observedAt?: number | null;
  adapter?: 'mock' | 'fnn';
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
  status: 'OPEN' | 'IN_PROGRESS' | 'NEEDS_REVIEW' | 'NEEDS_REVISION' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  resultArtifact: string | null;
  completedBy: string | null;
  createdAt: number;
  updatedAt?: number;
  version?: number;
  validation?: { passed: boolean; checks: Array<{ name: string; passed: boolean; detail: string }>; checkedAt: number } | null;
  modelMetadata?: { model: string; tokens: number; durationMs: number; live: boolean } | null;
  reviewNote?: string | null;
}

export interface ChannelStats {
  channelId: string;
  creatorBalanceCkb: number;
  workerBalanceCkb: number;
  totalCapacityCkb: number;
  settledCount: number;
  totalVolumeCkb: number;
}

export interface SignedReceipt {
  schemaVersion: 1;
  network: 'ckb_testnet';
  taskId: string;
  invoiceId: string;
  creator: string;
  worker: string;
  rewardShannons: string;
  paymentHash: string;
  artifactDigest: string;
  validation: NonNullable<BountyTask['validation']>;
  model: NonNullable<BountyTask['modelMetadata']>;
  acceptedAt: number;
  receiverState: string;
  payerState: string | null;
  issuerKeyId: string;
  issuerPublicKey: string;
  signature: string;
}
