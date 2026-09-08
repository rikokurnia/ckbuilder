import { GeminiFlashClient } from './gemini_client';
import { FiberHoldInvoiceEngine } from './fiber_engine';
import { BountyTask, AIExecutionResult } from './types';

export class AutonomousAIWorker {
  public name: string;
  public workerNodePubkey: string;
  private geminiClient: GeminiFlashClient;

  constructor(
    name = 'Sentinel-Flash AI Worker',
    workerNodePubkey = 'ckb1_sentinel_worker_pubkey',
    apiKey?: string
  ) {
    this.name = name;
    this.workerNodePubkey = workerNodePubkey;
    this.geminiClient = new GeminiFlashClient(apiKey);
  }

  public getModelName(): string {
    return this.geminiClient.getModel();
  }

  /**
   * Complete end-to-end task execution by autonomous AI worker:
   * 1. Lock Hold Invoice in Fiber Network
   * 2. Execute analysis via Gemini Flash model
   * 3. Settle Hold Invoice with cryptographic preimage
   */
  public async processBounty(
    task: BountyTask,
    fiberEngine: FiberHoldInvoiceEngine
  ): Promise<{
    task: BountyTask;
    executionResult: AIExecutionResult;
    settlementDurationMs: number;
  }> {
    console.log(`\n======================================================`);
    console.log(`🤖 [${this.name}] Detected Open Bounty: "${task.title}"`);
    console.log(`💰 Reward: ${task.rewardCkb} CKB | Category: ${task.category}`);
    console.log(`======================================================`);

    // Step 1: Lock Hold Invoice in the channel
    task.status = 'IN_PROGRESS';
    fiberEngine.lockHoldInvoice(task.invoiceId, this.workerNodePubkey);

    // Step 2: Execute task with Gemini Flash
    console.log(`🧠 [${this.name}] Processing analysis with ${this.geminiClient.getModel()}...`);
    const executionResult = await this.geminiClient.executeTask(task.prompt, task.category);

    task.resultArtifact = executionResult.analysis;
    task.completedBy = this.name;

    // Step 3: Settle the Hold Invoice using the secret Preimage
    console.log(`🔑 [${this.name}] Releasing cryptographic preimage to Fiber channel...`);
    const { durationMs } = fiberEngine.settleHoldInvoice(
      task.invoiceId,
      executionResult.proofPreimage
    );

    task.status = 'COMPLETED';

    console.log(`✅ [${this.name}] Bounty Finished! Result delivered & ${task.rewardCkb} CKB earned.`);
    return {
      task,
      executionResult,
      settlementDurationMs: durationMs,
    };
  }
}
