# AgentBounty safe deployment guide

This deployment runs the Next.js frontend and API routes together, persists application state in Supabase, calls Gemini from the server, and keeps payments in the approved `mock` testnet demonstration mode. The custom CKB lock is not deployed.

## 1. Install the Supabase schema

Open Supabase Dashboard → SQL Editor → New query. Paste and run:

`supabase/migrations/20260915000000_agent_bounty_state.sql`

Then confirm `agent_bounty_state` appears in Table Editor. RLS is enabled, browser roles have no grants, and only the server-side service role can access it.

## 2. Import the project into Vercel

1. Import the Git repository in Vercel.
2. Set **Root Directory** to `week3_report_builderTrack/01_agent-bounty/frontend`.
3. Enable **Include source files outside of the Root Directory** so the internal `../services` workspace package is bundled.
4. Keep Framework Preset as Next.js. `frontend/vercel.json` performs locked installs for `services` and `frontend` independently so Vercel's packager finds Next inside the application root, then uses the standard `.next` output.
5. Use Node.js 22.x.

## 3. Configure Vercel environment variables

Add these to Production and Preview:

```text
CKB_NETWORK=testnet
PAYMENT_ADAPTER=mock
GEMINI_API_KEY=<server-only key>
GEMINI_MODEL=gemini-3.5-flash
APP_AUTH_SECRET=<existing 32-byte random value>
APP_ENCRYPTION_KEY=<existing 32-byte random value>
APP_RECEIPT_SIGNING_KEY=<another 32-byte random value>
SUPABASE_URL=<project URL>
SUPABASE_SERVICE_ROLE_KEY=<server-only service role key>
ALLOW_MODEL_FALLBACK=false
ALLOW_DEMO_ACCEPTANCE=false
ALLOW_GUEST_MUTATIONS=false
```

Do not create `NEXT_PUBLIC_APP_*`, `NEXT_PUBLIC_GEMINI_*`, or `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`. Do not configure `AGENT_BOUNTY_DATA_FILE` on Vercel.

## 4. Deploy and verify

Deploy the project, then open:

```text
https://<your-domain>/api/health
```

The expected response contains `status: ok`, `network: ckb_testnet`, `paymentAdapter: mock`, `persistence: supabase`, and `modelConfigured: true`.

Run one low-value demo lifecycle with two browser sessions:

1. Connect the creator wallet and publish a bounty.
2. Connect the worker wallet and execute it.
3. Confirm the result stops at **Needs review**.
4. Reconnect the creator wallet, accept it, and confirm receiver/payer mock states become terminal.
5. Reload in both browsers and confirm the task persists.

## 5. Release safety

- Keep the project on CKB testnet. The backend refuses any `CKB_NETWORK` other than `testnet`.
- Keep `PAYMENT_ADAPTER=mock` for the submission demo. Switching to `fnn` still requires the deferred spike and adapter calibration.
- Never deploy or fund `contracts/bounty-lock`; ADR-001 defers it because its payout/refund constraints are unsafe.
- Preserve `APP_ENCRYPTION_KEY`. Losing or rotating it without a migration makes stored payment secrets unreadable.
- Rotate the Supabase service-role key immediately if it ever appears in browser code, screenshots, logs, or Git history.
- Use Vercel deployment protection for previews if they contain private task artifacts.

## 6. Rollback

Use Vercel Deployments → select the last healthy deployment → Promote to Production. Application state remains in Supabase and is not rolled back with the frontend. Avoid rolling back across a future database schema change unless that migration includes a compatibility plan.
