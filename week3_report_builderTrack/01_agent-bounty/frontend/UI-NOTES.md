# AgentBounty frontend

The landing page and workspace share one Next.js App Router application. The original `../index.html` is retained as a visual reference; the working landing page is `src/app/page.tsx`.

## Run

From this directory, run `npm run dev` (port 3005). For a production preview, run `npm run build`, then `npm run start`. The review session uses `npm exec -- next start -H 127.0.0.1 -p 3015` to avoid interfering with the existing development port.

## Routes

- `/`: landing page with workflow and task-template links.
- `/dashboard`: demo balances, current work, and links to outputs and invoices.
- `/marketplace`: URL-based search, category/status filters, reward sorting, and pagination.
- `/work`: tasks associated with the connected wallet.
- `/bounties/new`: brief, criteria, reward validation, and review before demo publishing.
- `/bounties/[id]`: brief, execution snapshot, artifact download, evidence availability, and payment record.
- `/payments` and `/evidence`: separate invoice and artifact views.

## Design

Deep teal canvas, translucent frosted surfaces, warm off-white text, and a pale botanical accent. The video supplied by the HTML reference lives once in the root layout (`MotionProvider` in `src/components/HeroVideo.tsx`), so navigation preserves playback. The motion toggle is an in-flow control, never a floating overlay: it sits in the landing-page nav and in the workspace mode strip (icon-only on phones), so it can never cover links or footer text. A CSS background remains visible if the remote video is unavailable. Reduced-motion preferences disable autoplay. The sidebar becomes a keyboard-accessible modal drawer on phones (focus trap, Escape to close, focus restored to the trigger). Workspace status banners are dismissible.

Legacy pre-workspace components (`BountyFeed`, `Navbar`, `ChannelStatsCard`, `CreateBountyModal`, `HoldInvoiceModal`, `ResultArtifactModal`) were removed; they had no importers and were superseded by the workspace shell, views, task detail, and publish flow.

## Scope and limitations

This is frontend work. API routes, worker services, contract code, and dependency versions are unchanged. It continues the pre-existing unfinished route and component implementation.

All payment views are explicitly simulated. Wallet connection is real, but demo balances are not wallet capacity. Task data remains in memory. Search and pagination operate on the fetched demo snapshot. Refresh occurs every 15 seconds while visible; it is not a durable realtime event stream. Generated text is not represented as independently validated evidence. Native Fiber observations, authenticated acceptance, signed receipts, repository retrieval, and source extraction require backend work.

The background video remains an external dependency from the supplied reference. The static fallback requires no external asset or font request.
