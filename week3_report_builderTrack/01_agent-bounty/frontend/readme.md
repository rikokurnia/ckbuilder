# AgentBounty Frontend dApp

The interactive web interface for **AgentBounty**, built with **Next.js 15 (App Router)**, **Tailwind CSS**, and **CCC (`@ckb-ccc/connector-react`)**.

---

## ColorHunt Palette Applied

The UI design is styled using the official ColorHunt theme [`#09637E`, `#088395`, `#7AB2B2`, `#EBF4F6`](https://colorhunt.co/palette/09637e0883957ab2b2ebf4f6):

| Token | Hex | UI Role |
| :--- | :---: | :--- |
| **Deep Teal** | `#09637E` | Brand headers, primary buttons, card border accents |
| **Cerulean Teal** | `#088395` | Interactive highlights, active badges, status indicators |
| **Soft Sage** | `#7AB2B2` | Subtitle text, secondary borders, progress bars |
| **Ice Clean White** | `#EBF4F6` | Canvas background, card surface, contrast highlights |

---

## Features & Components

The workspace UI lives in `src/app/(workspace)/` (Overview, Marketplace, My Work, Payments, Evidence, task detail, publish flow) behind `src/components/workspace/WorkspaceShell.tsx`. Shared elements: `Brand.tsx`, `HeroVideo.tsx` (single root-layout backdrop video + in-flow motion toggle), `CccWrapper.tsx` (CKB testnet client).

> Outdated reference: earlier revisions of this file named `Navbar.tsx`, `ChannelStatsCard.tsx`, `BountyFeed.tsx`, `HoldInvoiceModal.tsx`, and `ResultArtifactModal.tsx`. Those components were removed during the frontend completion pass; their links below are struck through and retained only as history.

1. ~~CCC Wallet Connector (`src/components/Navbar.tsx`)~~ — replaced by the workspace topbar wallet button (connect/disconnect via `@ckb-ccc/connector-react`; supports JoyID, UniSat, OKX, MetaMask; testnet only).
2. ~~Fiber Channel Telemetry Card (`src/components/ChannelStatsCard.tsx`)~~ — replaced by Overview stats and the Payments ledger. Previously displayed hard-coded speed/fee labels; those claims were removed. Payment records now identify the active adapter and its observed native states.
3. ~~Bounty Marketplace Feed (`src/components/BountyFeed.tsx`)~~ — replaced by URL-based Marketplace search, filters, sorting, and pagination.
4. ~~Interactive Hold Invoice Inspector (`src/components/HoldInvoiceModal.tsx`)~~ — replaced by the task-detail Payment tab and the Payments ledger. Local mock observations are labeled; native receiver and payer states appear when the calibrated FNN adapter is enabled.
5. ~~Verified AI Delivery Report (`src/components/ResultArtifactModal.tsx`)~~ — replaced by the task-detail Result tab. Artifacts are generated text, not independently validated evidence; no "verified" badge is shown.

---

## Integrated implementation status (15 September 2026)

- `npm run build` passes on Next.js 15.5.24. The landing page, workspace routes, publish → execute → review → settle flow, and responsive layouts have been verified in a production preview.
- Next API routes use `agent-bounty-services` as the single state authority. Atomic files provide local persistence; hosted deployments use Supabase with revision-checked writes. Tasks, invoice projections, idempotency records, timelines, encrypted preimages, and signed receipts survive restart.
- Mutations require a server-verified CCC wallet challenge and HTTP-only session. Execution stops at human review; the creator alone may accept settlement or request revision.
- `PAYMENT_ADAPTER=mock` is the verified local path. Native FNN remains disabled until the funded two-node v0.9.1 spike is completed and its RPC observations are calibrated. See `UI-NOTES.md` and `../docs/manual-integration-checklist.md`.

---

## Development & Running Locally

```bash
# Install dependencies
npm install

# Run development server (Port 3005)
npm run dev

# Build production bundle
npm run build
```

Open [http://localhost:3005](http://localhost:3005) in your browser.
