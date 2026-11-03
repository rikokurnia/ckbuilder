import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export type TaskCategory = 'CODE_AUDIT' | 'DEEP_RESEARCH';
export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'NEEDS_REVIEW' | 'NEEDS_REVISION' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
export type InvoiceStatus = 'OPEN' | 'HELD' | 'SETTLED' | 'CANCELLED' | 'FAILED';

export interface ValidationResult {
  passed: boolean;
  checks: Array<{ name: string; passed: boolean; detail: string }>;
  checkedAt: number;
}
export interface ModelMetadata { model: string; tokens: number; durationMs: number; live: boolean }
export interface BountyTask {
  id: string; title: string; description: string; category: TaskCategory; prompt: string;
  rewardCkb: number; rewardShannons: string; creator: string; invoiceId: string; paymentHash: string;
  status: TaskStatus; resultArtifact: string | null; completedBy: string | null; createdAt: number;
  updatedAt: number; version: number; validation: ValidationResult | null; modelMetadata: ModelMetadata | null;
  reviewNote: string | null;
}
export interface HoldInvoice {
  id: string; paymentHash: string; preimage: string | null; amountCkb: number; amountShannons: string;
  taskId: string; creatorPubkey: string; workerPubkey: string | null; status: InvoiceStatus; createdAt: number;
  settledAt: number | null; nativeInvoiceId: string | null; nativeInvoiceState: string | null;
  nativePaymentState: string | null; observedAt: number | null; adapter: 'mock' | 'fnn';
}
export interface ChannelStats {
  channelId: string; creatorBalanceCkb: number; workerBalanceCkb: number; totalCapacityCkb: number;
  settledCount: number; totalVolumeCkb: number;
}
export interface TimelineEvent { id: string; taskId: string; type: string; message: string; createdAt: number }
export interface ReceiptPayload {
  schemaVersion: 1; network: 'ckb_testnet'; taskId: string; invoiceId: string; creator: string; worker: string;
  rewardShannons: string; paymentHash: string; artifactDigest: string; validation: ValidationResult;
  model: ModelMetadata; acceptedAt: number; receiverState: string; payerState: string | null;
  issuerKeyId: string; issuerPublicKey: string;
}
export type SignedReceipt = ReceiptPayload & { signature: string };
interface SecretRecord { iv: string; tag: string; value: string }
interface PersistedState {
  schemaVersion: 1; bounties: BountyTask[]; invoices: HoldInvoice[]; events: TimelineEvent[];
  secrets: Record<string, SecretRecord>; idempotency: Record<string, unknown>; receipts: Record<string, SignedReceipt>; channel: ChannelStats;
}
export interface Snapshot {
  bounties: BountyTask[]; invoices: HoldInvoice[]; channel: ChannelStats; events: TimelineEvent[]; receipts: SignedReceipt[];
  mode: { payment: 'mock' | 'fnn'; persistence: 'file' | 'supabase'; modelFallbackAllowed: boolean };
}
export interface ModelResult { analysis: string; model: string; tokens: number; durationMs: number; live: boolean }
export interface ModelAdapter { execute(prompt: string, category: TaskCategory): Promise<ModelResult> }
export interface PaymentAdapter {
  readonly kind: 'mock' | 'fnn';
  registerInvoice(invoice: HoldInvoice): Promise<{ nativeInvoiceId: string; state: string }>;
  holdInvoice(invoice: HoldInvoice): Promise<{ invoiceState: string; paymentState: string | null }>;
  settleInvoice(invoice: HoldInvoice, preimage: string): Promise<{ invoiceState: string; paymentState: string | null }>;
  cancelInvoice(invoice: HoldInvoice): Promise<{ invoiceState: string; paymentState: string | null }>;
}

export class BackendError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 400, public readonly retryable = false) { super(message); }
}

class GeminiModelAdapter implements ModelAdapter {
  async execute(prompt: string, category: TaskCategory): Promise<ModelResult> {
    const started = Date.now();
    const key = process.env.GEMINI_API_KEY || '';
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    if (!key || key.length < 10 || key.includes('your_gemini')) {
      if (process.env.ALLOW_MODEL_FALLBACK !== 'true')
        throw new BackendError('MODEL_EXECUTION_FAILED', 'GEMINI_API_KEY is not configured and demo fallback is disabled.', 503, true);
      return { analysis: fallbackReport(prompt, category), model: `${model} (demo fallback)`, tokens: Math.ceil(prompt.length / 4), durationMs: Date.now() - started, live: false };
    }
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: modelPrompt(prompt, category) }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 4096 } }),
    });
    if (!response.ok)
      throw new BackendError('MODEL_EXECUTION_FAILED', `Gemini returned HTTP ${response.status}.`, 502, response.status === 429 || response.status >= 500);
    const data = (await response.json()) as any;
    const analysis = data.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('').trim();
    if (!analysis) throw new BackendError('MODEL_EXECUTION_FAILED', 'Gemini returned no usable artifact.', 502, true);
    return { analysis, model, tokens: data.usageMetadata?.totalTokenCount || Math.ceil((prompt.length + analysis.length) / 4), durationMs: Date.now() - started, live: true };
  }
}

export class MockPaymentAdapter implements PaymentAdapter {
  readonly kind = 'mock' as const;
  async registerInvoice(invoice: HoldInvoice) { return { nativeInvoiceId: `mock_${invoice.id}`, state: 'Open' }; }
  async holdInvoice() { return { invoiceState: 'Received', paymentState: 'Inflight' }; }
  async settleInvoice() { return { invoiceState: 'Paid', paymentState: 'Success' }; }
  async cancelInvoice() { return { invoiceState: 'Cancelled', paymentState: 'Failed' }; }
}

export class FnnRpcAdapter implements PaymentAdapter {
  readonly kind = 'fnn' as const;
  constructor(private readonly receiverUrl = process.env.FNN_RECEIVER_RPC_URL || 'http://127.0.0.1:8227', private readonly payerUrl = process.env.FNN_PAYER_RPC_URL || 'http://127.0.0.1:8229') {}
  private async rpc(url: string, method: string, params: unknown[]): Promise<any> {
    const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: crypto.randomUUID(), method, params }) });
    if (!response.ok) throw new BackendError('PAYMENT_ROUTE_UNAVAILABLE', `FNN RPC ${method} returned HTTP ${response.status}.`, 502, true);
    const payload = (await response.json()) as any;
    if (payload.error) throw new BackendError('INVOICE_STATE_UNSUPPORTED', payload.error.message || `FNN RPC ${method} failed.`, 409);
    return payload.result;
  }
  async registerInvoice(invoice: HoldInvoice) {
    const result = await this.rpc(this.receiverUrl, 'new_invoice', [{ amount: invoice.amountShannons, currency: 'Fibt', payment_hash: `0x${invoice.paymentHash}`, hash_algorithm: 'sha256', description: `AgentBounty ${invoice.taskId}`, expiry: '86400' }]);
    return { nativeInvoiceId: result?.invoice_address || result?.invoice || invoice.paymentHash, state: result?.status || 'Open' };
  }
  async holdInvoice(invoice: HoldInvoice) {
    if (!invoice.nativeInvoiceId) throw new BackendError('INVOICE_STATE_UNSUPPORTED', 'Native invoice was not registered.', 409);
    await this.rpc(this.payerUrl, 'send_payment', [{ invoice: invoice.nativeInvoiceId, dry_run: true }]);
    await this.rpc(this.payerUrl, 'send_payment', [{ invoice: invoice.nativeInvoiceId, timeout: 120, max_fee_amount: '100000' }]);
    const observed = await this.rpc(this.receiverUrl, 'get_invoice', [{ payment_hash: `0x${invoice.paymentHash}` }]);
    return { invoiceState: observed?.status || 'Received', paymentState: 'Inflight' };
  }
  async settleInvoice(invoice: HoldInvoice, preimage: string) {
    await this.rpc(this.receiverUrl, 'settle_invoice', [{ payment_hash: `0x${invoice.paymentHash}`, payment_preimage: `0x${preimage}` }]);
    const [receiver, payer] = await Promise.all([
      this.rpc(this.receiverUrl, 'get_invoice', [{ payment_hash: `0x${invoice.paymentHash}` }]),
      this.rpc(this.payerUrl, 'get_payment', [{ payment_hash: `0x${invoice.paymentHash}` }]),
    ]);
    return { invoiceState: receiver?.status || 'Unknown', paymentState: payer?.status || 'Unknown' };
  }
  async cancelInvoice(invoice: HoldInvoice) {
    await this.rpc(this.receiverUrl, 'cancel_invoice', [{ payment_hash: `0x${invoice.paymentHash}` }]);
    const observed = await this.rpc(this.receiverUrl, 'get_invoice', [{ payment_hash: `0x${invoice.paymentHash}` }]);
    return { invoiceState: observed?.status || 'Cancelled', paymentState: null };
  }
}

export class AgentBountyBackend {
  private state: PersistedState;
  private queue: Promise<unknown> = Promise.resolve();
  private readonly persistence: 'file' | 'supabase';
  private revision = 0;
  constructor(private readonly dataFile = process.env.AGENT_BOUNTY_DATA_FILE || path.resolve(process.cwd(), '.data/agentbounty.json'), private readonly model: ModelAdapter = new GeminiModelAdapter(), private readonly payments: PaymentAdapter = process.env.PAYMENT_ADAPTER === 'fnn' ? new FnnRpcAdapter() : new MockPaymentAdapter()) {
    this.persistence = supabaseConfig() ? 'supabase' : 'file';
    this.state = this.persistence === 'file' ? this.loadFile() : this.defaultState();
  }

  async initialize() {
    assertTestnet();
    if (this.persistence === 'supabase') await this.loadSupabase();
    return this;
  }

  async refresh() { await this.serial(() => this.sync()); return this.snapshot(); }

  snapshot(): Snapshot {
    return clone({ bounties: [...this.state.bounties].sort((a, b) => b.createdAt - a.createdAt), invoices: [...this.state.invoices].sort((a, b) => b.createdAt - a.createdAt), channel: this.state.channel, events: [...this.state.events].sort((a, b) => b.createdAt - a.createdAt), receipts: Object.values(this.state.receipts).sort((a, b) => b.acceptedAt - a.acceptedAt), mode: { payment: this.payments.kind, persistence: this.persistence, modelFallbackAllowed: process.env.ALLOW_MODEL_FALLBACK === 'true' } });
  }

  async createTask(input: { title: string; description?: string; category: string; prompt: string; rewardCkb: unknown; creator?: string }, key?: string): Promise<BountyTask> {
    return this.serial(async () => {
      await this.sync();
      const creator = cleanActor(input.creator), requestKey = scopedKey('create', creator, key);
      const cached = this.cached<BountyTask>(requestKey); if (cached) return cached;
      const title = requiredText(input.title, 'title', 160), prompt = requiredText(input.prompt, 'prompt', 20_000);
      if (!['CODE_AUDIT', 'DEEP_RESEARCH'].includes(input.category)) throw new BackendError('INVALID_TASK_INPUT', 'Unsupported task category.');
      const rewardCkb = parseCkb(input.rewardCkb);
      if (rewardCkb > this.state.channel.creatorBalanceCkb) throw new BackendError('INVALID_TASK_INPUT', 'Reward exceeds the available managed balance.');
      const now = Date.now(), taskId = id('task'), invoiceId = id('inv'), preimage = crypto.randomBytes(32).toString('hex'), paymentHash = sha256Hex(preimage);
      const invoice: HoldInvoice = { id: invoiceId, paymentHash, preimage: null, amountCkb: rewardCkb, amountShannons: ckbToShannons(rewardCkb), taskId, creatorPubkey: creator, workerPubkey: null, status: 'OPEN', createdAt: now, settledAt: null, nativeInvoiceId: null, nativeInvoiceState: null, nativePaymentState: null, observedAt: null, adapter: this.payments.kind };
      const native = await this.payments.registerInvoice(invoice);
      invoice.nativeInvoiceId = native.nativeInvoiceId; invoice.nativeInvoiceState = native.state; invoice.observedAt = Date.now();
      const task: BountyTask = { id: taskId, title, description: requiredText(input.description || title, 'description', 5_000), category: input.category as TaskCategory, prompt, rewardCkb, rewardShannons: invoice.amountShannons, creator: invoice.creatorPubkey, invoiceId, paymentHash, status: 'OPEN', resultArtifact: null, completedBy: null, createdAt: now, updatedAt: now, version: 1, validation: null, modelMetadata: null, reviewNote: null };
      this.state.secrets[invoiceId] = seal(preimage); this.state.channel.creatorBalanceCkb -= rewardCkb;
      this.state.bounties.push(task); this.state.invoices.push(invoice); this.event(taskId, 'TASK_CREATED', 'Task published and payment commitment registered.');
      this.remember(requestKey, task); await this.save(); return clone(task);
    });
  }

  async executeTask(taskId: string, workerName = 'Autonomous Sentinel Node', key?: string): Promise<BountyTask> {
    const worker = cleanActor(workerName), requestKey = scopedKey('execute', `${taskId}:${worker}`, key);
    const claimed = await this.serial(async () => {
      await this.sync();
      const cached = this.cached<BountyTask>(requestKey); if (cached) return { cached };
      const task = this.task(taskId);
      if (task.status !== 'OPEN' && task.status !== 'NEEDS_REVISION') throw new BackendError('TASK_ALREADY_CLAIMED', `Task cannot run from ${task.status}.`, 409);
      const invoice = this.invoice(task.invoiceId);
      if (invoice.status !== 'OPEN' && invoice.status !== 'HELD') throw new BackendError('INVOICE_STATE_UNSUPPORTED', `Invoice cannot hold from ${invoice.status}.`, 409);
      if (invoice.status === 'OPEN') { const observed = await this.payments.holdInvoice(invoice); invoice.status = 'HELD'; invoice.nativeInvoiceState = observed.invoiceState; invoice.nativePaymentState = observed.paymentState; invoice.observedAt = Date.now(); }
      task.status = 'IN_PROGRESS'; task.completedBy = worker; invoice.workerPubkey = worker; bump(task); this.event(task.id, 'RUN_STARTED', `${worker} claimed the task.`); await this.save(); return { task: clone(task) };
    });
    if ('cached' in claimed && claimed.cached) return claimed.cached;
    try {
      const result = await this.model.execute(claimed.task.prompt, claimed.task.category);
      return this.serial(async () => {
        await this.sync();
        const task = this.task(taskId);
        if (task.status !== 'IN_PROGRESS') throw new BackendError('TASK_VERSION_CONFLICT', 'Task changed while the worker was running.', 409, true);
        task.resultArtifact = result.analysis; task.modelMetadata = { model: result.model, tokens: result.tokens, durationMs: result.durationMs, live: result.live }; task.validation = validateArtifact(task); task.status = task.validation.passed ? 'NEEDS_REVIEW' : 'NEEDS_REVISION'; bump(task);
        this.event(task.id, 'VALIDATION_COMPLETED', task.validation.passed ? 'Automated checks passed; human review is required.' : 'Artifact needs revision before review.'); this.remember(requestKey, task); await this.save(); return clone(task);
      });
    } catch (error) {
      await this.serial(async () => { await this.sync(); const task = this.task(taskId); task.status = 'NEEDS_REVISION'; bump(task); this.event(task.id, 'RUN_FAILED', error instanceof Error ? `${error.message} Retry is available; held funds were not released.` : 'Worker execution failed. Retry is available; held funds were not released.'); await this.save(); });
      throw error;
    }
  }

  async reviewTask(taskId: string, decision: 'accept' | 'reject', actor: string, note = '', key?: string): Promise<BountyTask> {
    return this.serial(async () => {
      await this.sync();
      const reviewer = cleanActor(actor), requestKey = scopedKey(`review:${decision}`, `${taskId}:${reviewer}`, key);
      const cached = this.cached<BountyTask>(requestKey); if (cached) return cached;
      const task = this.task(taskId);
      if (reviewer !== task.creator) throw new BackendError('FORBIDDEN_ACTION', 'Only the task creator can review this result.', 403);
      if (task.status !== 'NEEDS_REVIEW') throw new BackendError('INVOICE_STATE_UNSUPPORTED', `Task cannot be reviewed from ${task.status}.`, 409);
      if (decision === 'reject') { task.status = 'NEEDS_REVISION'; task.reviewNote = requiredText(note, 'review note', 2_000); bump(task); this.event(task.id, 'REVISION_REQUESTED', task.reviewNote); }
      else {
        if (!task.validation?.passed) throw new BackendError('ARTIFACT_VALIDATION_FAILED', 'Automated checks have not passed.', 409);
        if (task.modelMetadata?.live === false && process.env.ALLOW_DEMO_ACCEPTANCE !== 'true') throw new BackendError('ARTIFACT_VALIDATION_FAILED', 'Demo fallback output cannot be accepted unless ALLOW_DEMO_ACCEPTANCE=true.', 409);
        const invoice = this.invoice(task.invoiceId), preimage = unseal(this.state.secrets[invoice.id]);
        if (sha256Hex(preimage) !== invoice.paymentHash) throw new BackendError('PREIMAGE_COMMITMENT_MISMATCH', 'Stored secret does not match the immutable invoice commitment.', 409);
        const observed = await this.payments.settleInvoice(invoice, preimage);
        if (observed.invoiceState.toLowerCase() !== 'paid' || (observed.paymentState && observed.paymentState.toLowerCase() !== 'success')) throw new BackendError('PAYMENT_OUTCOME_UNKNOWN', `Settlement is not terminal: receiver=${observed.invoiceState}, payer=${observed.paymentState || 'unknown'}.`, 503, true);
        invoice.status = 'SETTLED'; invoice.preimage = preimage; invoice.settledAt = Date.now(); invoice.nativeInvoiceState = observed.invoiceState; invoice.nativePaymentState = observed.paymentState; invoice.observedAt = Date.now();
        task.status = 'COMPLETED'; task.reviewNote = note.trim() || null; bump(task); this.state.channel.workerBalanceCkb += invoice.amountCkb; this.state.channel.settledCount += 1; this.state.channel.totalVolumeCkb += invoice.amountCkb; this.state.receipts[task.id] = issueReceipt(task, invoice); this.event(task.id, 'SETTLEMENT_OBSERVED', 'Creator accepted the artifact, both payment sides reached terminal state, and a signed receipt was issued.');
      }
      this.remember(requestKey, task); await this.save(); return clone(task);
    });
  }

  async cancelTask(taskId: string, actor: string, key?: string): Promise<BountyTask> {
    return this.serial(async () => {
      await this.sync();
      const creator = cleanActor(actor), requestKey = scopedKey('cancel', `${taskId}:${creator}`, key);
      const cached = this.cached<BountyTask>(requestKey); if (cached) return cached;
      const task = this.task(taskId); if (creator !== task.creator) throw new BackendError('FORBIDDEN_ACTION', 'Only the task creator can cancel this task.', 403);
      const invoice = this.invoice(task.invoiceId); if (invoice.status !== 'OPEN') throw new BackendError('INVOICE_STATE_UNSUPPORTED', 'Only an open invoice can be cancelled immediately.', 409);
      const observed = await this.payments.cancelInvoice(invoice); invoice.status = 'CANCELLED'; invoice.nativeInvoiceState = observed.invoiceState; invoice.nativePaymentState = observed.paymentState; invoice.observedAt = Date.now(); task.status = 'CANCELLED'; bump(task); this.state.channel.creatorBalanceCkb += invoice.amountCkb; this.event(task.id, 'TASK_CANCELLED', 'Open invoice cancelled and reservation released.'); this.remember(requestKey, task); await this.save(); return clone(task);
    });
  }

  private defaultState(): PersistedState {
    return { schemaVersion: 1, bounties: [], invoices: [], events: [], secrets: {}, idempotency: {}, receipts: {}, channel: { channelId: this.payments.kind === 'fnn' ? 'fnn-observed' : 'mock-durable-channel', creatorBalanceCkb: 5000, workerBalanceCkb: 0, totalCapacityCkb: 5000, settledCount: 0, totalVolumeCkb: 0 } };
  }
  private loadFile(): PersistedState {
    if (fs.existsSync(this.dataFile)) return normalizeState(JSON.parse(fs.readFileSync(this.dataFile, 'utf8')) as PersistedState);
    return this.defaultState();
  }
  private async loadSupabase() {
    const config = supabaseConfig();
    if (!config) throw new BackendError('SERVER_CONFIGURATION_ERROR', 'Supabase persistence is not configured.', 503);
    const response = await supabaseFetch(config, '/rest/v1/agent_bounty_state?id=eq.default&select=state,revision');
    if (!response.ok) throw await supabaseError(response, 'load state');
    const rows = await response.json() as Array<{ state: PersistedState; revision: number }>;
    if (rows[0]) { this.state = normalizeState(rows[0].state); this.revision = rows[0].revision; return; }
    const initial = this.defaultState();
    const created = await supabaseFetch(config, '/rest/v1/agent_bounty_state', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=representation' }, body: JSON.stringify({ id: 'default', revision: 0, state: initial }) });
    if (!created.ok) throw await supabaseError(created, 'initialize state');
    const inserted = await created.json() as Array<{ state: PersistedState; revision: number }>;
    if (inserted[0]) { this.state = inserted[0].state; this.revision = inserted[0].revision; return; }
    await this.loadSupabase();
  }
  private async sync() { if (this.persistence === 'supabase') await this.loadSupabase(); }
  private async save() {
    if (this.persistence === 'file') {
      fs.mkdirSync(path.dirname(this.dataFile), { recursive: true }); const temp = `${this.dataFile}.${process.pid}.tmp`; fs.writeFileSync(temp, JSON.stringify(this.state, null, 2), { mode: 0o600 }); fs.renameSync(temp, this.dataFile); return;
    }
    const config = supabaseConfig();
    if (!config) throw new BackendError('SERVER_CONFIGURATION_ERROR', 'Supabase persistence is not configured.', 503);
    const nextRevision = this.revision + 1;
    const response = await supabaseFetch(config, `/rest/v1/agent_bounty_state?id=eq.default&revision=eq.${this.revision}&select=revision`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ state: this.state, revision: nextRevision, updated_at: new Date().toISOString() }) });
    if (!response.ok) throw await supabaseError(response, 'save state');
    const rows = await response.json() as Array<{ revision: number }>;
    if (!rows[0]) throw new BackendError('TASK_VERSION_CONFLICT', 'State changed on another server instance. Refresh and retry the operation.', 409, true);
    this.revision = rows[0].revision;
  }
  private serial<T>(operation: () => Promise<T> | T): Promise<T> { const next = this.queue.then(operation, operation); this.queue = next.then(() => undefined, () => undefined); return next; }
  private task(idValue: string) { const value = this.state.bounties.find((item) => item.id === idValue); if (!value) throw new BackendError('TASK_NOT_FOUND', 'Task not found.', 404); return value; }
  private invoice(idValue: string) { const value = this.state.invoices.find((item) => item.id === idValue); if (!value) throw new BackendError('INVOICE_NOT_FOUND', 'Invoice not found.', 404); return value; }
  private event(taskId: string, type: string, message: string) { this.state.events.push({ id: crypto.randomUUID(), taskId, type, message, createdAt: Date.now() }); }
  private cached<T>(key?: string): T | undefined {
    if (!key || this.state.idempotency[key] === undefined) return undefined;
    return clone(this.state.idempotency[key] as T);
  }
  private remember(key: string | undefined, value: unknown) { if (key) this.state.idempotency[key] = clone(value); }
}

function validateArtifact(task: BountyTask): ValidationResult {
  const text = task.resultArtifact || '';
  const checks = [
    { name: 'Artifact returned', passed: text.trim().length >= 120, detail: 'At least 120 characters of reviewable output.' },
    { name: 'Structured findings', passed: /^#{1,3}\s/m.test(text), detail: 'Contains a Markdown section heading.' },
    task.category === 'CODE_AUDIT'
      ? { name: 'Reproducible reference', passed: /(`[^`]+`|\b[a-zA-Z0-9_/-]+\.(rs|ts|tsx|js|md)(:\d+)?\b)/.test(text), detail: 'Includes a command, file, or line reference.' }
      : { name: 'Source reference', passed: /(https?:\/\/|source|citation|retriev)/i.test(text), detail: 'Includes a source or retrieval reference.' },
  ];
  return { passed: checks.every((check) => check.passed), checks, checkedAt: Date.now() };
}
function modelPrompt(prompt: string, category: TaskCategory) { const requirement = category === 'CODE_AUDIT' ? 'Cite exact files or code symbols and include at least one reproducible command in backticks.' : 'Map factual claims to source URLs and include retrieval dates.'; return `You are an AgentBounty worker. Produce a concise Markdown artifact. Separate evidence, conclusions, and limitations. ${requirement}\n\nTask:\n${prompt}`; }
function fallbackReport(prompt: string, category: TaskCategory) { return `## Demo artifact\n\nThis local fallback records the requested ${category.toLowerCase().replace('_', ' ')} task without claiming live research or verification.\n\n## Input reviewed\n\n${prompt.slice(0, 500)}\n\n## Limitation\n\nNo live model or external source was used. Inspect \`services/src/backend.ts\` before relying on this output.`; }
function requiredText(value: unknown, field: string, max: number) { if (typeof value !== 'string' || !value.trim()) throw new BackendError('INVALID_TASK_INPUT', `${field} is required.`); const clean = value.trim(); if (clean.length > max) throw new BackendError('INVALID_TASK_INPUT', `${field} is too long.`); return clean; }
function cleanActor(value: unknown) { return typeof value === 'string' && value.trim() ? value.trim() : 'demo_guest'; }
function assertTestnet() {
  const network = (process.env.CKB_NETWORK || 'testnet').toLowerCase();
  if (network !== 'testnet') throw new BackendError('SERVER_CONFIGURATION_ERROR', 'AgentBounty is testnet-only. Set CKB_NETWORK=testnet.', 503);
}
function scopedKey(operation: string, subject: string, key?: string) { return key ? `${operation}:${subject}:${key}` : undefined; }
function parseCkb(value: unknown) { const text = String(value); if (!/^\d+(\.\d{1,8})?$/.test(text)) throw new BackendError('INVALID_TASK_INPUT', 'Reward must be a positive CKB amount with at most 8 decimals.'); const amount = Number(text); if (!Number.isSafeInteger(Math.round(amount * 1e8)) || amount <= 0) throw new BackendError('INVALID_TASK_INPUT', 'Reward is outside the supported range.'); return amount; }
function ckbToShannons(value: number) { return String(Math.round(value * 1e8)); }
function sha256Hex(preimage: string) { return crypto.createHash('sha256').update(Buffer.from(preimage, 'hex')).digest('hex'); }
function digestText(value: string) { return crypto.createHash('sha256').update(value, 'utf8').digest('hex'); }
function encryptionKey() {
  const configured = process.env.APP_ENCRYPTION_KEY;
  if (!configured && process.env.NODE_ENV === 'production') throw new BackendError('SERVER_CONFIGURATION_ERROR', 'APP_ENCRYPTION_KEY is required in production.', 503);
  return crypto.createHash('sha256').update(configured || 'agentbounty-local-development-only').digest();
}
function seal(value: string): SecretRecord { const iv = crypto.randomBytes(12), cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv), encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]); return { iv: iv.toString('hex'), tag: cipher.getAuthTag().toString('hex'), value: encrypted.toString('hex') }; }
function unseal(record: SecretRecord) { const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(record.iv, 'hex')); decipher.setAuthTag(Buffer.from(record.tag, 'hex')); return Buffer.concat([decipher.update(Buffer.from(record.value, 'hex')), decipher.final()]).toString('utf8'); }
function receiptPrivateKey() {
  const configured = process.env.APP_RECEIPT_SIGNING_KEY || process.env.APP_ENCRYPTION_KEY;
  if (!configured && process.env.NODE_ENV === 'production') throw new BackendError('SERVER_CONFIGURATION_ERROR', 'APP_RECEIPT_SIGNING_KEY is required in production.', 503);
  const seed = /^[a-fA-F0-9]{64}$/.test(configured || '') ? Buffer.from(configured!, 'hex') : crypto.createHash('sha256').update(configured || 'agentbounty-local-receipt-only').digest();
  const der = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]);
  return crypto.createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
}
function receiptMessage(receipt: ReceiptPayload) { return Buffer.from(JSON.stringify(receipt), 'utf8'); }
function issueReceipt(task: BountyTask, invoice: HoldInvoice): SignedReceipt {
  if (!task.resultArtifact || !task.validation || !task.modelMetadata || !invoice.settledAt || !invoice.nativeInvoiceState) throw new BackendError('RECEIPT_VERIFICATION_FAILED', 'Settled task is missing receipt evidence.', 500);
  const privateKey = receiptPrivateKey();
  const publicDer = crypto.createPublicKey(privateKey).export({ format: 'der', type: 'spki' }) as Buffer;
  const payload: ReceiptPayload = { schemaVersion: 1, network: 'ckb_testnet', taskId: task.id, invoiceId: invoice.id, creator: task.creator, worker: task.completedBy || '', rewardShannons: task.rewardShannons, paymentHash: task.paymentHash, artifactDigest: digestText(task.resultArtifact), validation: task.validation, model: task.modelMetadata, acceptedAt: invoice.settledAt, receiverState: invoice.nativeInvoiceState, payerState: invoice.nativePaymentState, issuerKeyId: digestText(publicDer.toString('base64')).slice(0, 16), issuerPublicKey: publicDer.toString('base64') };
  return { ...payload, signature: crypto.sign(null, receiptMessage(payload), privateKey).toString('base64') };
}
export function verifyReceipt(receipt: SignedReceipt) {
  try {
    const { signature, ...payload } = receipt;
    const publicKey = crypto.createPublicKey({ key: Buffer.from(payload.issuerPublicKey, 'base64'), format: 'der', type: 'spki' });
    return crypto.verify(null, receiptMessage(payload), publicKey, Buffer.from(signature, 'base64'));
  } catch { return false; }
}
function normalizeState(state: PersistedState): PersistedState { return { ...state, receipts: state.receipts || {} }; }
function bump(task: BountyTask) { task.version += 1; task.updatedAt = Date.now(); }
function id(prefix: string) { return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`; }
function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
type SupabaseConfig = { url: string; key: string };
function supabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url: url.replace(/\/$/, ''), key } : null;
}
function supabaseFetch(config: SupabaseConfig, endpoint: string, init: RequestInit = {}) {
  return fetch(`${config.url}${endpoint}`, { ...init, headers: { apikey: config.key, authorization: `Bearer ${config.key}`, 'content-type': 'application/json', ...(init.headers || {}) } });
}
async function supabaseError(response: Response, action: string) {
  const detail = (await response.text()).slice(0, 500);
  return new BackendError('PERSISTENCE_UNAVAILABLE', `Could not ${action} in Supabase (HTTP ${response.status}). ${detail}`, 503, true);
}
const globalBackend = globalThis as unknown as { agentBountyBackend?: Promise<AgentBountyBackend> };
export function getBackend() {
  if (!globalBackend.agentBountyBackend) {
    const backend = new AgentBountyBackend();
    globalBackend.agentBountyBackend = backend.initialize().catch((error) => { delete globalBackend.agentBountyBackend; throw error; });
  }
  return globalBackend.agentBountyBackend;
}
