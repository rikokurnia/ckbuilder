# ADR-001: Payment custody, secret ownership, and acceptance

- Status: **approved** (operator sign-off, 14 September 2026). Binding for Phase 1 implementation.
- Date: 14 September 2026
- Decides plan item "payment/acceptance ADR" from `random_things/agentbounty-improvement-plan.md` §12 Phase 0.3
- Locked operator decisions: operator-mediated settlement · hosted Supabase · L1 escrow deferred · FNN v0.9.1 spike candidate

## 1. Custody model

**Operator-mediated release.** The application operator runs the receiving service (invoice registration, hold observation, settlement submission) and enforces the release policy below. This is an explicitly trusted-operator design for the testnet slice: it is testable now and does not claim trustless fair exchange. Strict self-custody (buyer-held vs worker-held preimage with adjudication) is out of scope until Phase 3 demand exists.

Consequences:

- The operator's receiving FNN node is the only invoice registrar. Payers submit encoded invoices via `send_payment` to that node.
- Human acceptance is required for subjective work (reviews, research). Deterministic checks gate machine-verifiable criteria; neither alone releases funds.
- Operator keys and payment credentials never enter model context, logs, or the browser.

## 2. Roles

| Role | Holds | May |
|---|---|---|
| Creator (buyer) | funds, acceptance decision | publish, fund, accept, reject, request cancellation where protocol state allows |
| Worker (provider) | execution capability, approved destination | claim (lease), run, submit artifact |
| Operator (service) | receiving node, release policy | register invoices, observe both payment sides, settle after acceptance, reconcile |

Wallet connection authenticates UI display only. Every financial or workflow mutation requires a server session bound to a signed challenge (nonce, domain, expiry) plus a task-permission check. Spoofed `creator`/`worker` strings are rejected.

## 3. Secret ownership and invoice lifecycle

1. The worker generates the 32-byte preimage **before** execution and commits `payment_hash = SHA-256(preimage)` at claim time. The preimage is stored server-side, sealed, never shown to the creator or the model.
2. The operator registers the hold invoice on the receiving node with the supplied payment hash (hold invoice: preimage absent). Hash algorithm is explicitly SHA-256 on both sides; cross-implementation test vectors are required in the FNN spike.
3. **Commitments are immutable.** The current demo behavior of overwriting an invoice's payment hash to match a newly generated secret (`execute-agent/route.ts`) is classified as defect `PREIMAGE_COMMITMENT_MISMATCH` and is forbidden: a secret that does not match the accepted invoice rejects settlement without modifying the invoice.
4. Settlement flow: acceptance recorded → operator submits preimage via `settle_invoice` → operator observes **both** receiver invoice state and sender payment state → task marked `Completed` only after observed terminal states. An RPC success return alone is not settlement proof.
5. Cancellation follows observed native state only. `cancel_invoice` is valid solely for `Open` invoices; a held payment enters `Recovery pending` with its actual expiry until funds are observed available again. No immediate-refund claims.

## 4. Task and payment states (stored separately)

- Task: `Draft → Awaiting funding → Ready → Assigned → Running → Validating → Needs review → Accepted → Completed`, with `Failed`, `Needs revision`, `Cancel requested`, `Recovery pending`, `Cancelled`.
- Payment (application projection alongside native states): `Preparing → Awaiting hold observation → Hold observed → Settlement requested → Settlement observed → Recovery pending → Failed`. Unknown native states are preserved verbatim, never forced into "Completed."
- Actions derive from allowed server transitions only. Cancelled tasks expose no dispatch action. Every unavailable action carries its exact reason.

## 5. Acceptance policy (two task templates)

- **Repository review (pinned commit):** deterministic checks — artifact schema valid, file/line references resolve against the recorded commit snapshot, reproducible command present. Human acceptance still required for finding quality.
- **Technical research (citations):** deterministic checks — every claim maps to a persisted source with retrieval timestamp, no uncited factual claims. Human acceptance required for usefulness.
- Rejected output keeps funds unreleased and moves the task to `Needs revision` with named failed checks. No template-fallback output may settle a live task; fallback is demo-mode only and labeled.

## 6. Money rules

- Amounts are integer base units (Shannons) serialized as strings. Reject negative, zero, fractional-sub-unit, out-of-range, and malformed amounts. Strictly validate currency precision, hash hex length, category, and task ownership at the API boundary.
- Per-task, per-session, and per-day spending caps plus approved worker destinations and invoice expiry are enforced before any paid work starts (preflight includes route/fee check; no usable path means no paid execution).
- Display available, held, pending, and earned funds as separate figures. Held funds are never presented as worker earnings.
- Financial/workflow mutations require idempotency keys scoped to actor and operation; concurrent claims resolve atomically (one lease winner, loser links to the active run).

## 7. Deferred: independent L1 escrow

The custom `bounty-lock` is **not** attached to any Fiber channel and is not funded in Phases 0–1. Verified gaps (14 Sep 2026 inspection): Path A constrains no recipient/amount; Path B checks neither creator authority (`creator_lock_hash` unused) nor timeout; capacity check is global only. Re-admission requires the redesign and CKB-VM test suite listed in the contract README note. This ADR must be amended before any L1 rail carries value.

## 8. What the FNN spike must prove (exit gate)

Against pinned FNN v0.9.1, two funded testnet nodes: hold creation, payer submission, receiver hold observation, matching settlement, mismatched-secret rejection, duplicate request safety, cancellation before hold, rejection after hold, actual TLC timeout, node crash/restart, unknown-outcome reconciliation. Each case records: sender state, receiver state, timestamps, fees observed. The backend `FnnAdapter` interface (§9) is frozen against spike results before Phase 1 implementation.

## 9. Phase 1 API shape (preview, versioned)

`/api/v1`: list/create bounties, task detail, claim/execute, artifact upload, validation status, accept/reject, cancellation request, payment inspection, receipt retrieval/verification, authorized event subscription (Supabase Realtime on committed rows; SSE fallback if self-hosting). Responses carry request IDs, task versions, structured error codes from the plan registry, and explicit retryability.

## 10. Non-goals

Mainnet, decentralized arbitration, cross-chain behavior, unrestricted autonomous spending, ZK/TEE correctness claims, transferable rights, automatic code publishing, GPU marketplace operation.
