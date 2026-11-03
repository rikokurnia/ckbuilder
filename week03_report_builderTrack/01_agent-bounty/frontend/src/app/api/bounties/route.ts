import { BackendError, getBackend } from 'agent-bounty-services';
import { NextResponse } from 'next/server';
import { actorFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function requestId() { return crypto.randomUUID(); }
function failure(error: unknown, id: string) {
  const known = error instanceof BackendError;
  return NextResponse.json({ success: false, requestId: id, error: error instanceof Error ? error.message : 'Unexpected backend error.', code: known ? error.code : 'INTERNAL_ERROR', retryable: known ? error.retryable : false }, { status: known ? error.status : 500 });
}

export async function GET() {
  const id = requestId();
  try { const backend = await getBackend(); return NextResponse.json({ success: true, requestId: id, data: await backend.refresh() }); }
  catch (error) { return failure(error, id); }
}

export async function POST(request: Request) {
  const id = requestId();
  try {
    const actor = actorFromRequest(request);
    if (!actor) throw new BackendError('AUTH_REQUIRED', 'Connect and sign with a wallet before publishing.', 401);
    const body = await request.json();
    const backend = await getBackend();
    const task = await backend.createTask({ ...body, creator: actor }, request.headers.get('idempotency-key') || undefined);
    return NextResponse.json({ success: true, requestId: id, data: { task, ...backend.snapshot() } }, { status: 201 });
  } catch (error) { return failure(error, id); }
}
