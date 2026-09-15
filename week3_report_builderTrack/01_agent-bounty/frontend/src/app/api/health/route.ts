import { getBackend } from 'agent-bounty-services';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const backend = await getBackend();
    const snapshot = await backend.refresh();
    return NextResponse.json({
      status: 'ok',
      network: 'ckb_testnet',
      paymentAdapter: snapshot.mode.payment,
      persistence: snapshot.mode.persistence,
      modelConfigured: Boolean(process.env.GEMINI_API_KEY),
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Health check failed.',
      checkedAt: new Date().toISOString(),
    }, { status: 503 });
  }
}
