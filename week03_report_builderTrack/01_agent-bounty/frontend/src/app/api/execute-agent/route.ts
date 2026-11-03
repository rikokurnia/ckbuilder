import { BackendError, getBackend } from 'agent-bounty-services';
import { NextResponse } from 'next/server';
import { actorFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const actor = actorFromRequest(request);
    if (!actor) throw new BackendError('AUTH_REQUIRED', 'Connect and sign with a wallet before changing task state.', 401);
    const body = await request.json(), key = request.headers.get('idempotency-key') || undefined;
    const backend = await getBackend();
    let task;
    if (!body.action || body.action === 'execute') task = await backend.executeTask(body.taskId, actor, key);
    else if (body.action === 'accept' || body.action === 'reject') task = await backend.reviewTask(body.taskId, body.action, actor, body.note, key);
    else if (body.action === 'cancel') task = await backend.cancelTask(body.taskId, actor, key);
    else throw new BackendError('INVALID_TASK_INPUT', 'Unsupported task action.');
    return NextResponse.json({ success: true, requestId, data: { task, ...backend.snapshot() } });
  } catch (error) {
    const known = error instanceof BackendError;
    return NextResponse.json({ success: false, requestId, error: error instanceof Error ? error.message : 'Unexpected backend error.', code: known ? error.code : 'INTERNAL_ERROR', retryable: known ? error.retryable : false }, { status: known ? error.status : 500 });
  }
}
