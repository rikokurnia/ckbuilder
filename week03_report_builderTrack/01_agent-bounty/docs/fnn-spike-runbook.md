# FNN v0.9.1 two-node spike runbook (Phase 0 exit gate) — TESTNET ONLY

- Pinned release: **v0.9.1**. Binary + CLI verified 14 Sep 2026 against the tagged RPC README and `fnn-cli --help`.
- **Node R** = receiver/operator (default ports, RPC `127.0.0.1:8227`). **Node P** = payer (RPC `127.0.0.1:8229`, P2P `9228`). Both on CKB **testnet**. Test amounts only. Never reuse these node keys or configs on mainnet.
- All commands below are copy-paste. If any command errors, stop and paste the full output back — do not improvise past it.

## 0. Verified RPC facts (do not second-guess these)

- Amounts are integer **Shannons** (1 CKB = 100,000,000). This sheet uses: 10 CKB = `1000000000`, 1000 CKB = `100000000000`, max fee `100000` Shannons.
- Pass **`--hash-algorithm sha256` on every invoice.** The node default is `ckb_hash`, which will not match our SHA-256 preimages.
- Hashes/preimages are `0x`-prefixed 32-byte hex.
- `cancel_invoice` works **only** on `Open` invoices. `settle_invoice` returns nothing — always follow with `get_invoice` (R) and `get_payment` (P).
- Invoice: `Open | Cancelled | Expired | Received | Paid`. Payment: `Created -> Inflight -> Success | Failed`.
- Keep a log: append `-o json` output of every state-changing call to `~/fnn-spike/results.log` for section 5.

## 1. Install

```bash
mkdir -p ~/fnn-spike && cd ~/fnn-spike
curl -sL -o fnn.tgz https://github.com/nervosnetwork/fiber/releases/download/v0.9.1/fnn_v0.9.1-x86_64-linux-portable.tar.gz
tar xzf fnn.tgz
./fnn --version          # expect v0.9.1
./fnn-cli --version
```

## 2. Configure (testnet config, two data dirs)

```bash
cd ~/fnn-spike
cp -r config/testnet nodeR-config
cp -r config/testnet nodeP-config
# Node P must not reuse R's ports. Edit nodeP-config/config.yml:
#   fiber.listening_addr: "/ip4/0.0.0.0/tcp/8228"  ->  "/ip4/0.0.0.0/tcp/9228"
sed -i 's|/ip4/0.0.0.0/tcp/8228|/ip4/0.0.0.0/tcp/9228|' nodeP-config/config.yml
#   rpc.listening_addr: "127.0.0.1:8227"           ->  "127.0.0.1:8229"
sed -i 's|127.0.0.1:8227|127.0.0.1:8229|' nodeP-config/config.yml
grep -n "listening_addr" nodeP-config/config.yml
```

Start both (two terminals, or `nohup ... &` + `tail -f` the logs):

```bash
cd ~/fnn-spike
./fnn -c nodeR-config/config.yml -d nodeR-data
./fnn -c nodeP-config/config.yml -d nodeP-data
```

Wait for RF logs to show CKB testnet sync progress. **Back up both data dirs' key files before funding** (`cp -r nodeR-data nodeR-data.bak` etc.).

Shortcuts for the rest of this sheet:

```bash
R="--url http://127.0.0.1:8227"
P="--url http://127.0.0.1:8229"
CLI=~/fnn-spike/fnn-cli
$CLI info node_info $R -o json | tee nodeR-info.json | head -c 600; echo
$CLI info node_info $P -o json | tee nodeP-info.json | head -c 600; echo
# Save the two pubkeys, confirm both report the testnet chain.
```

## 3. Fund (faucet → node locks)

```bash
$CLI info node_info $R -o json | node <repo>/01_agent-bounty/docs/fnn-addr.mjs
# ^ replace <repo> with your ckbuilder path. Prints the ckt... faucet address for R. Same with $P for P.
```

- Request testnet CKB from the faucet to **P's address**: enough for one 1000 CKB channel + fees (≈ 1100 CKB; claim twice if the faucet caps per request).
- Request a small amount to **R's address** (≈ 100 CKB, covers fee edge cases; R opens nothing).
- Wait for confirmations (check the faucet tx on the testnet explorer), then continue.

## 4. Peer + channel

```bash
# R learns P as a peer (use P's multiaddr: /ip4/127.0.0.1/tcp/9228/p2p/<P_PUB without 0x?> — take the exact
# multiaddr form from nodeP-info.json addresses, or connect by pubkey now that both share testnet bootnodes):
$CLI peer connect_peer $R --pubkey <P_PUB>
$CLI peer list_peers $R
# P opens the channel (1000 CKB = 100000000000 Shannons), R accepts with zero funding:
$CLI channel open_channel $P --pubkey <R_PUB> --funding-amount 100000000000 -o json | tee open.json
$CLI channel list_channels $R --only-pending
$CLI channel accept_channel $R --temporary-channel-id <TEMP_ID> --funding-amount 0 -o json | tee accept.json
# Wait until available, then verify Ready on both sides and record channel_id:
$CLI channel list_channels $R
$CLI channel list_channels $P
```

Fallback (only if direct P↔R channel will not confirm): open R→ testnet public node instead —
pubkey `02b6d4e3ab86a2ca2fad6fae0ecb2e1e559e0b911939872a90abdda6d20302be71`, minimum 499 CKB auto-accepted —
and say so in the results; cases 1–9 still apply with routed/self payment noted.

## 5. Spike cases (in order; log everything)

```bash
PREIMAGE=0x$(openssl rand -hex 32)
PAYHASH=0x$(echo -n "$PREIMAGE" | xxd -r -p | openssl dgst -sha256 -hex | awk '{print $2}')
echo "PREIMAGE=$PREIMAGE"; echo "PAYHASH=$PAYHASH"
```

**Case 1 — hold creation (R):**

```bash
$CLI invoice new_invoice $R --amount 1000000000 --currency Fibt --payment-hash $PAYHASH --hash-algorithm sha256 --description spike-case-1 --expiry 86400 -o json | tee case1.json
$CLI invoice get_invoice $R --payment-hash $PAYHASH   # expect Open; save the invoice_address
```

**Case 2 — payer submission (P):** preflight first, then pay:

```bash
$CLI payment send_payment $P --invoice <INVOICE_ADDRESS> --dry-run
$CLI payment send_payment $P --invoice <INVOICE_ADDRESS> --timeout 120 --max-fee-amount 100000 -o json | tee case2.json
```

**Case 3 — hold observation + matching settlement:**

```bash
$CLI invoice get_invoice $R --payment-hash $PAYHASH
$CLI payment get_payment $P --payment-hash $PAYHASH
$CLI invoice settle_invoice $R --payment-hash $PAYHASH --payment-preimage $PREIMAGE
$CLI invoice get_invoice $R --payment-hash $PAYHASH    # record terminal status + timestamps
$CLI payment get_payment $P --payment-hash $PAYHASH    # record terminal status + fee
```

**Case 4 — mismatched secret:** new hash H2 (`PAYHASH2` generated like above) → invoice → pay → settle with the case-1 `$PREIMAGE` → expect rejection, invoice unchanged. Save the exact error.

**Case 5 — duplicate request:** re-run `send_payment` for the settled case-1 invoice and re-run `settle_invoice` → save the exact behavior (idempotent success or named error).

**Case 6 — cancellation before hold:** fresh hash H3 → `new_invoice` → `cancel_invoice` while `Open` → expect success → `send_payment` against it → expect failure. Save both outputs.

**Case 7 — rejection after hold:** fresh hash H4 → invoice → pay (held) → `cancel_invoice` → must fail outside `Open`. Save the exact error and the invoice status afterwards (this defines our `Recovery pending` mapping — do not retry or force anything).

**Case 8 — actual TLC timeout:** fresh hash H5 with `--expiry 57600 --final-expiry-delta 57600000` (shortest acceptable: 16h floor) → pay → do NOT settle → wait for expiry → record receiver status, sender payment outcome, and fund availability on both sides with timestamps.

**Case 9 — crash/restart:** fresh hash H6 → invoice → pay (held) → stop the R process (`Ctrl-C` / `kill`) → restart with the same `-d nodeR-data` → `get_invoice` → settle → `get_payment` on both sides. Record whether the held state survived.

## 6. Results to hand back

`~/fnn-spike/results.log` plus: the two pubkeys, amounts used, every preimage/hash pair (testnet spike only — safe to share), all `get_invoice`/`get_payment` statuses with timestamps, fees observed, exact error strings for cases 4/5/7, expiry timings for case 8, restart behavior for case 9. These calibrate the `FnnAdapter` interface (ADR-001 §8/§9); Phase 1 payment code is written against them, not against assumptions.
