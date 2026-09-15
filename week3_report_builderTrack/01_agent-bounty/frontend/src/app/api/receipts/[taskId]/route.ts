import { getBackend, verifyReceipt } from 'agent-bounty-services';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const backend = await getBackend();
  const snapshot = await backend.refresh();
  const receipt = snapshot.receipts.find((item) => item.taskId === taskId);
  if (!receipt) return NextResponse.json({ success: false, code: 'RECEIPT_NOT_FOUND', error: 'Signed receipt not found.' }, { status: 404 });
  return NextResponse.json({ success: true, verified: verifyReceipt(receipt), data: receipt });
}
