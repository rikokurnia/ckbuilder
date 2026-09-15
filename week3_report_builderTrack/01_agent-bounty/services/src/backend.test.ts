import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { AgentBountyBackend, BackendError, MockPaymentAdapter, ModelAdapter, verifyReceipt } from './backend';

const dirs: string[] = [];
afterEach(() => { for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true }); });

const model: ModelAdapter = {
  execute: async () => ({
    analysis: '## Finding\n\nThe relevant file is `src/main.rs:42`. Reproduce with `cargo test`. This artifact is long enough for deterministic validation and still requires human review.',
    model: 'test-model', tokens: 30, durationMs: 1, live: true,
  }),
};

function createBackend() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentbounty-'));
  dirs.push(dir);
  return { app: new AgentBountyBackend(path.join(dir, 'state.json'), model, new MockPaymentAdapter()), file: path.join(dir, 'state.json') };
}

test('keeps the commitment immutable and requires creator acceptance before settlement', async () => {
  const { app } = createBackend();
  const created = await app.createTask({ title: 'Review lock', description: 'Review lock', category: 'CODE_AUDIT', prompt: 'Review src/main.rs and cite a command.', rewardCkb: '10', creator: 'alice' }, 'create-1');
  const commitment = created.paymentHash;
  const reviewed = await app.executeTask(created.id, 'worker', 'run-1');
  assert.equal(reviewed.status, 'NEEDS_REVIEW');
  assert.equal(reviewed.paymentHash, commitment);
  assert.equal(app.snapshot().invoices[0].status, 'HELD');
  const settled = await app.reviewTask(created.id, 'accept', 'alice', 'Looks good', 'accept-1');
  assert.equal(settled.status, 'COMPLETED');
  assert.equal(app.snapshot().invoices[0].status, 'SETTLED');
  assert.equal(app.snapshot().channel.workerBalanceCkb, 10);
  assert.equal(app.snapshot().receipts.length, 1);
  assert.equal(verifyReceipt(app.snapshot().receipts[0]), true);
});

test('rejects spoofed acceptance and duplicate claims', async () => {
  const { app } = createBackend();
  const task = await app.createTask({ title: 'Review Fiber adapter', category: 'CODE_AUDIT', prompt: 'Review src/main.rs and cite a reproducible command.', rewardCkb: 5, creator: 'alice' });
  await app.executeTask(task.id);
  await assert.rejects(() => app.reviewTask(task.id, 'accept', 'mallory'), (error: BackendError) => error.code === 'FORBIDDEN_ACTION');
  await assert.rejects(() => app.executeTask(task.id), (error: BackendError) => error.code === 'TASK_ALREADY_CLAIMED');
});

test('persists state and makes create idempotent', async () => {
  const { app, file } = createBackend();
  const input = { title: 'Review capacity', category: 'CODE_AUDIT', prompt: 'Review capacity math in src/main.rs and cite a test command.', rewardCkb: '2.5', creator: 'alice' };
  const first = await app.createTask(input, 'same-request');
  const second = await app.createTask(input, 'same-request');
  assert.equal(first.id, second.id);
  assert.equal(app.snapshot().bounties.length, 1);
  const reloaded = new AgentBountyBackend(file, model, new MockPaymentAdapter());
  assert.equal(reloaded.snapshot().bounties[0].paymentHash, first.paymentHash);
});

test('rejects malformed rewards without reserving funds', async () => {
  const { app } = createBackend();
  await assert.rejects(() => app.createTask({ title: 'Bad amount', category: 'CODE_AUDIT', prompt: 'Review a valid prompt with enough detail.', rewardCkb: '-1' }), (error: BackendError) => error.code === 'INVALID_TASK_INPUT');
  assert.equal(app.snapshot().channel.creatorBalanceCkb, 5000);
});

test('scopes idempotency keys across operations and binds the worker identity', async () => {
  const { app } = createBackend();
  const task = await app.createTask({ title: 'Scoped request', category: 'CODE_AUDIT', prompt: 'Review src/main.rs and cite a reproducible command.', rewardCkb: '3', creator: 'alice' }, 'shared-key');
  const reviewed = await app.executeTask(task.id, 'bob', 'shared-key');
  assert.equal(reviewed.status, 'NEEDS_REVIEW');
  assert.equal(reviewed.completedBy, 'bob');
  assert.equal(app.snapshot().invoices[0].workerPubkey, 'bob');
  const settled = await app.reviewTask(task.id, 'accept', 'alice', 'Approved', 'shared-key');
  assert.equal(settled.status, 'COMPLETED');
});

test('keeps held funds retryable when model execution fails', async () => {
  const { app: seeded, file } = createBackend();
  const task = await seeded.createTask({ title: 'Retry model', category: 'CODE_AUDIT', prompt: 'Review src/main.rs and cite a reproducible command.', rewardCkb: '4', creator: 'alice' });
  const failingModel: ModelAdapter = { execute: async () => { throw new BackendError('MODEL_EXECUTION_FAILED', 'Model unavailable.', 503, true); } };
  const app = new AgentBountyBackend(file, failingModel, new MockPaymentAdapter());
  await assert.rejects(() => app.executeTask(task.id, 'bob'), (error: BackendError) => error.code === 'MODEL_EXECUTION_FAILED');
  assert.equal(app.snapshot().bounties[0].status, 'NEEDS_REVISION');
  assert.equal(app.snapshot().invoices[0].status, 'HELD');
});

test('rejects a tampered signed receipt', async () => {
  const { app } = createBackend();
  const task = await app.createTask({ title: 'Receipt integrity', category: 'CODE_AUDIT', prompt: 'Review src/main.rs and cite a reproducible command.', rewardCkb: '2', creator: 'alice' });
  await app.executeTask(task.id, 'bob');
  await app.reviewTask(task.id, 'accept', 'alice');
  const receipt = app.snapshot().receipts[0];
  assert.equal(verifyReceipt({ ...receipt, rewardShannons: '999' }), false);
});

test('persists and reloads state through the Supabase compare-and-swap store', async () => {
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalFetch = globalThis.fetch;
  let row: { state: unknown; revision: number } | null = null;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role';
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if ((init?.method || 'GET') === 'GET') return new Response(JSON.stringify(row ? [row] : []), { status: 200 });
    if (init?.method === 'POST') {
      const body = JSON.parse(String(init.body));
      row = { state: body.state, revision: body.revision };
      return new Response(JSON.stringify([row]), { status: 201 });
    }
    if (init?.method === 'PATCH') {
      const expected = Number(url.match(/revision=eq\.(\d+)/)?.[1]);
      if (!row || row.revision !== expected) return new Response('[]', { status: 200 });
      const body = JSON.parse(String(init.body));
      row = { state: body.state, revision: body.revision };
      return new Response(JSON.stringify([{ revision: row.revision }]), { status: 200 });
    }
    return new Response('Unsupported', { status: 500 });
  };
  try {
    const app = await new AgentBountyBackend('/tmp/unused', model, new MockPaymentAdapter()).initialize();
    await app.createTask({ title: 'Supabase state', category: 'CODE_AUDIT', prompt: 'Review src/main.rs and cite a reproducible command.', rewardCkb: '1', creator: 'alice' });
    assert.equal(app.snapshot().mode.persistence, 'supabase');
    const reloaded = await new AgentBountyBackend('/tmp/unused', model, new MockPaymentAdapter()).initialize();
    assert.equal(reloaded.snapshot().bounties.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  }
});
