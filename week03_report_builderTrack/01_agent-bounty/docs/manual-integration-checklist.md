# Manual integration checklist

The local product lifecycle is integrated and verified with `PAYMENT_ADAPTER=mock`. The following steps require accounts, funds, secrets, or long-running infrastructure and must be done by the operator.

## Deferred native Fiber research

These steps are not a blocker for the approved `PAYMENT_ADAPTER=mock` submission deployment. Complete them before changing the active adapter to `fnn`.

1. Run `bash docs/fnn-spike.sh` from `01_agent-bounty`. It downloads FNN v0.9.1 under `~/fnn-spike`, starts receiver RPC `8227` and payer RPC `8229`, and prints two CKB testnet addresses.
2. Fund the printed payer address with roughly 1,100 testnet CKB and the receiver with roughly 100 testnet CKB from the faucet. These must be testnet funds.
3. Continue the script through cases 1–9. Case 8 has a protocol floor of roughly 16 hours, so run `bash docs/fnn-spike.sh check-expiry` after expiry.
4. Review `~/fnn-spike/results.log`. Confirm exact v0.9.1 JSON-RPC request/response shapes, both terminal states, fee fields, duplicate behavior, held-cancellation behavior, and restart recovery. Keep `PAYMENT_ADAPTER=mock` until these observations match `services/src/backend.ts`.
5. Set `PAYMENT_ADAPTER=fnn`, `FNN_RECEIVER_RPC_URL`, and `FNN_PAYER_RPC_URL` only on the server. Never expose node credentials or preimages through `NEXT_PUBLIC_*` variables.

## Required before public deployment

1. Generate independent random values for `APP_AUTH_SECRET` and `APP_ENCRYPTION_KEY`. Preserve `APP_ENCRYPTION_KEY`; changing it makes stored invoice secrets unreadable.
2. Apply `supabase/migrations/20260915000000_agent_bounty_state.sql` in the Supabase SQL Editor. The configured service-role key can read and write rows but cannot create the table itself.
3. Keep `ALLOW_GUEST_MUTATIONS`, `ALLOW_MODEL_FALLBACK`, and `ALLOW_DEMO_ACCEPTANCE` false. Configure `GEMINI_API_KEY` server-side.
4. Verify wallet signing on each wallet family you plan to advertise. The server uses CCC's signature verifier and an HTTP-only session cookie; this session verified compilation but could not approve signatures in your wallets.
5. Add a separate `APP_RECEIPT_SIGNING_KEY` for production. Until supplied, receipt signing derives a stable Ed25519 key from `APP_ENCRYPTION_KEY` for backward-compatible local operation.

## Smart contract

Do not deploy or fund `contracts/bounty-lock` yet. ADR-001 defers the independent L1 escrow rail because the current lock lacks payout destination constraints, creator refund authorization, and an enforced `since` timeout. Native Fiber integration does not require this custom lock. Reintroducing it requires an ADR amendment, a redesigned script, and transaction-level CKB-VM tests.
