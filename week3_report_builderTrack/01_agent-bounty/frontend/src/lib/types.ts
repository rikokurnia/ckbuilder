export type HoldInvoiceStatus = 'OPEN' | 'HELD' | 'SETTLED' | 'CANCELLED';

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
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  resultArtifact: string | null;
  completedBy: string | null;
  createdAt: number;
}

export interface ChannelStats {
  channelId: string;
  creatorBalanceCkb: number;
  workerBalanceCkb: number;
  totalCapacityCkb: number;
  settledCount: number;
  totalVolumeCkb: number;
}
