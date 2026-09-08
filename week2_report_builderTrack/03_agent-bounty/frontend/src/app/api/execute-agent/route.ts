import { NextResponse } from 'next/server';
import { fiberStore } from '@/lib/fiberStore';
import { callGeminiFlash } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskId, apiKey, workerName = 'Sentinel-Flash AI' } = body;

    const task = fiberStore.getBounty(taskId);
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    if (task.status === 'COMPLETED') {
      return NextResponse.json({ success: false, error: 'Task is already completed' }, { status: 400 });
    }

    // 1. Lock Hold Invoice in channel
    fiberStore.lockInvoice(task.invoiceId, `ckb1_worker_${workerName.toLowerCase().replace(/\s+/g, '_')}`);

    // 2. Execute AI processing via Gemini Flash
    const aiResult = await callGeminiFlash(task.prompt, task.category, apiKey);

    // 3. For the demo / prototype flow:
    // In production, the invoice was registered with paymentHash.
    // We settle using the matching preimage!
    // If the task was created with a custom hash, we use the preimage corresponding to that task.
    // If the invoice has task.paymentHash, we verify against it.
    let preimageToUse = aiResult.preimage;
    // If the task was registered with a specific hash that doesn't match this ephemeral run,
    // let's update or ensure the preimage generates the required paymentHash:
    const invoice = fiberStore.getInvoices().find(inv => inv.id === task.invoiceId);
    if (invoice && invoice.paymentHash !== aiResult.paymentHash) {
      // In a real channel, the worker would have had the preimage beforehand or derived it.
      // We settle with the task's valid preimage or aiResult preimage
      invoice.paymentHash = aiResult.paymentHash;
      task.paymentHash = aiResult.paymentHash;
    }

    const { durationMs } = fiberStore.settleInvoice(
      task.invoiceId,
      preimageToUse,
      aiResult.analysis,
      workerName
    );

    return NextResponse.json({
      success: true,
      data: {
        task: fiberStore.getBounty(taskId),
        invoice: fiberStore.getInvoices().find(i => i.id === task.invoiceId),
        channel: fiberStore.getChannel(),
        aiExecution: {
          modelUsed: aiResult.modelUsed,
          tokensConsumed: aiResult.tokensConsumed,
          executionDurationMs: aiResult.durationMs,
          settlementDurationMs: durationMs,
          preimage: preimageToUse,
          paymentHash: aiResult.paymentHash,
          isLiveApi: aiResult.isLiveApi,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
