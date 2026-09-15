# AgentBounty frontend

The landing page and workspace share one Next.js App Router application. The original `../index.html` is retained as a visual reference; the working landing page is `src/app/page.tsx`.

## Run

From this directory, run `npm run dev` (port 3005). For a production preview, run `npm run build`, then `npm run start`. The review session uses `npm exec -- next start -H 127.0.0.1 -p 3015` to avoid interfering with the existing development port.

## Routes

- `/`: landing page with workflow and task-template links.
- `/dashboard`: managed balances, current work, and links to outputs and invoices.
- `/marketplace`: URL-based search, category/status filters, reward sorting, and pagination.
- `/work`: tasks associated with the connected wallet.
- `/bounties/new`: brief, criteria, reward validation, wallet authentication, and review before publishing.
- `/bounties/[id]`: brief, execution snapshot, artifact download, evidence availability, and payment record.
- `/payments` and `/evidence`: separate invoice and artifact views.

## Design

Deep teal canvas, translucent frosted surfaces, warm off-white text, and a pale botanical accent. The video supplied by the HTML reference lives once in the root layout (`MotionProvider` in `src/components/HeroVideo.tsx`), so navigation preserves playback. The motion toggle is an in-flow control, never a floating overlay: it sits in the landing-page nav and in the workspace mode strip (icon-only on phones), so it can never cover links or footer text. A CSS background remains visible if the remote video is unavailable. Reduced-motion preferences disable autoplay. The sidebar becomes a keyboard-accessible modal drawer on phones (focus trap, Escape to close, focus restored to the trigger). Workspace status banners are dismissible.

Legacy pre-workspace components (`BountyFeed`, `Navbar`, `ChannelStatsCard`, `CreateBountyModal`, `HoldInvoiceModal`, `ResultArtifactModal`) were removed; they had no importers and were superseded by the workspace shell, views, task detail, and publish flow.

## Integrated backend lifecycle

Next API routes import `agent-bounty-services` as the single backend authority. Tasks and invoices use atomic file persistence locally and revision-checked Supabase persistence when hosted. The server owns an encrypted 32-byte preimage and exposes only its SHA-256 commitment until creator acceptance. Execution records model metadata and deterministic validation, then stops at `Needs review`. Acceptance verifies the original commitment, requires terminal receiver/payer observations, and issues a downloadable Ed25519-signed receipt.

Mutations require a CCC wallet signature challenge. The verified identity is kept in an HTTP-only, same-site session cookie. API payloads cannot choose their creator/reviewer identity. `ALLOW_GUEST_MUTATIONS=true` exists only for automated local demo testing.

`PAYMENT_ADAPTER=mock` supplies a durable local lifecycle. `PAYMENT_ADAPTER=fnn` uses the receiver/payer RPC endpoints in `.env.example`; enable it only after the two-node spike in `../docs/fnn-spike-runbook.md` passes.

## Scope and limitations

The custom CKB `bounty-lock` is not used as an escrow rail. ADR-001 explicitly defers it because the current contract does not bind settlement/refund outputs or enforce refund authority and timeout. It must not hold valuable capacity.

Mock payment views are explicitly labeled. Wallet connection is real, but mock balances are not wallet capacity. Search and pagination operate on the fetched snapshot. Authenticated sessions receive three-second SSE snapshots with 15-second polling as recovery. Generated text is not represented as independently validated evidence. Native Fiber verification requires the deferred funded-node spike. Repository snapshots and source extraction remain later evidence features.

The background video remains an external dependency from the supplied reference. The static fallback requires no external asset or font request.
