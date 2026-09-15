# AgentBounty submission completion report

Date: 15 September 2026

## Approved submission scope

- Network: CKB testnet only.
- Active payment mode: truthful `PAYMENT_ADAPTER=mock` demonstration.
- Native two-node FNN validation: funded but deferred as offline protocol research.
- Custom L1 bounty lock: deferred by ADR-001 and prohibited from holding funds.
- Hosting target: Vercel for Next.js frontend/API, Supabase for durable state.

## Delivered

- Unified Next.js landing page and responsive glass workspace.
- Wallet-signed authentication with server-owned actor identity and HTTP-only sessions.
- Strict task validation, integer Shannon accounting, scoped idempotency, serialized claims, and creator-only acceptance.
- Server-generated encrypted preimages with immutable SHA-256 commitments.
- Live Gemini execution with fallback and acceptance safety gates.
- Separate task, invoice, native observation, validation, and event records.
- Human review and revision before settlement.
- Atomic local persistence plus Supabase persistence with revision compare-and-swap.
- Authenticated SSE snapshots with polling recovery.
- Ed25519-signed acceptance receipts and tamper verification.
- Testnet runtime guard, health endpoint, security headers, Vercel configuration, migration, deployment guide, and rollback procedure.
- Eight backend lifecycle/security/persistence tests and four contract SHA-256 tests.

## Truthful exclusions

- Mock payment terminal states demonstrate the application protocol; they are not native Fiber settlement evidence.
- Generated artifacts remain subject to human review. A receipt proves integrity, recorded acceptance, and the selected adapter observation; it does not prove universal factual correctness.
- Repository snapshots and managed web-source archives require a future task-input/source-ingestion feature. The interface labels them missing rather than claiming verification.
- The current request-driven Gemini execution is suitable for the submission demo within the configured 60-second function duration. A production workload with longer jobs needs a durable queue and worker service.

## Release gate

All repository-controlled deliverables pass. The only remaining external action is applying the supplied Supabase SQL migration, followed by importing the repository into Vercel and copying the already-configured server secrets into Vercel environment settings. `/api/health` must report `ckb_testnet`, `mock`, and `supabase` before the public demo is announced.
