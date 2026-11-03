#!/usr/bin/env bash
# AgentBounty FNN v0.9.1 two-node spike — one command runs everything.
# TESTNET ONLY. Run:  bash docs/fnn-spike.sh
# 16h+ later, record the timeout case:  bash docs/fnn-spike.sh check-expiry
#
# The script pauses exactly ONCE: for you to fund the two node locks from the
# testnet faucet (it prints both addresses). Everything else polls and logs
# to ~/fnn-spike/results.log. Re-running resumes from the last finished step.
set -u
SPIKE_DIR="${SPIKE_DIR:-$HOME/fnn-spike}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI="$SPIKE_DIR/fnn-cli"
R_URL="http://127.0.0.1:8227"
P_URL="http://127.0.0.1:8229"
LOG="$SPIKE_DIR/results.log"
VARS="$SPIKE_DIR/spike.vars"
FNN_VER="v0.9.1"

log() { echo "[$(date -u +%H:%M:%S)] $*" | tee -a "$LOG"; }
die() { log "STOPPED: $*"; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }
need() { have "$1" || die "missing required tool: $1"; }
need python3; need openssl; need curl; need node

# find KEY anywhere in fnn-cli -o json output (envelope shapes vary)
jget() { python3 -c "
import json,sys
def find(o,k):
    if isinstance(o,dict):
        if k in o: return o[k]
        for v in o.values():
            r=find(v,k)
            if r is not None: return r
    elif isinstance(o,list):
        for v in o:
            r=find(v,k)
            if r is not None: return r
    return None
print(json.dumps(find(json.load(sys.stdin),'$1')))"
}
savevar() { grep -v "^$1=" "$VARS" 2>/dev/null > "$VARS.tmp"; echo "$1=$2" >> "$VARS.tmp"; mv "$VARS.tmp" "$VARS"; }
loadvars() { [ -f "$VARS" ] && . "$VARS"; return 0; }
rpc_up() { curl -s -m 3 -X POST "$1" -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"node_info","params":[]}' | grep -q pubkey; }

if [ "${1:-run}" = "check-expiry" ]; then
  loadvars
  [ -n "${H5:-}" ] || die "no case-8 hash saved; run the main spike first"
  log "=== CASE 8 follow-up ==="
  "$CLI" invoice get_invoice --url "$R_URL" --payment-hash "$H5" -o json | tee -a "$LOG"
  "$CLI" payment get_payment --url "$P_URL" --payment-hash "$H5" -o json | tee -a "$LOG"
  log "Paste $LOG section above back as the case-8 result."
  exit 0
fi

mkdir -p "$SPIKE_DIR"; touch "$LOG"; loadvars

# fnn encrypts node keys at rest; all three starts below inherit this.
if [ -f "$SPIKE_DIR/.fiber-secret" ]; then
  export FIBER_SECRET_KEY_PASSWORD="$(cat "$SPIKE_DIR/.fiber-secret")"
else
  export FIBER_SECRET_KEY_PASSWORD="$(openssl rand -hex 16)"
  printf '%s' "$FIBER_SECRET_KEY_PASSWORD" > "$SPIKE_DIR/.fiber-secret"
  chmod 600 "$SPIKE_DIR/.fiber-secret"
  log "generated node secret-key password (testnet-only keys)"
fi

# ---- 1. install ----
if [ ! -x "$CLI" ]; then
  log "downloading fnn $FNN_VER"
  curl -sL -o "$SPIKE_DIR/fnn.tgz" "https://github.com/nervosnetwork/fiber/releases/download/$FNN_VER/fnn_${FNN_VER}-x86_64-linux-portable.tar.gz" \
    || die "download failed"
  tar xzf "$SPIKE_DIR/fnn.tgz" -C "$SPIKE_DIR" || die "extract failed"
  "$SPIKE_DIR/fnn" --version | tee -a "$LOG"
else log "fnn already installed"; fi

# ---- 2. configure ----
if [ ! -f "$SPIKE_DIR/nodeR-config/config.yml" ]; then
  cp -r "$SPIKE_DIR/config/testnet" "$SPIKE_DIR/nodeR-config"
  cp -r "$SPIKE_DIR/config/testnet" "$SPIKE_DIR/nodeP-config"
  sed -i 's|/ip4/0.0.0.0/tcp/8228|/ip4/0.0.0.0/tcp/9228|' "$SPIKE_DIR/nodeP-config/config.yml"
  sed -i 's|127.0.0.1:8227|127.0.0.1:8229|' "$SPIKE_DIR/nodeP-config/config.yml"
  grep -n "listening_addr" "$SPIKE_DIR/nodeP-config/config.yml" | tee -a "$LOG"
else log "configs already present"; fi

# ---- 3. start nodes ----
for N in "R $R_URL nodeR-config nodeR-data" "P $P_URL nodeP-config nodeP-data"; do
  set -- $N; NAME=$1; URL=$2; CFG=$3; DAT=$4
  if rpc_up "$URL"; then log "node $NAME already running";
  else
    mkdir -p "$SPIKE_DIR/$DAT/ckb"
    if [ ! -f "$SPIKE_DIR/$DAT/ckb/key" ]; then
      openssl rand -hex 32 > "$SPIKE_DIR/$DAT/ckb/key"
      chmod 600 "$SPIKE_DIR/$DAT/ckb/key"
    fi
    [ -d "$SPIKE_DIR/$DAT" ] || cp -r "$SPIKE_DIR/${DAT}.bak" "$SPIKE_DIR/$DAT" 2>/dev/null || true
    log "starting node $NAME (first start syncs testnet headers — may take a while)"
    (cd "$SPIKE_DIR" && nohup ./fnn -c "$CFG/config.yml" -d "$DAT" > "$DAT.log" 2>&1 &)
    for _ in $(seq 1 100); do rpc_up "$URL" && break; sleep 6; done
    rpc_up "$URL" || die "node $NAME RPC never came up; see $SPIKE_DIR/$DAT.log"
  fi
done
R_PUB=$("$CLI" info node_info --url "$R_URL" -o json | jget pubkey | tr -d '"')
P_PUB=$("$CLI" info node_info --url "$P_URL" -o json | jget pubkey | tr -d '"')
[ -n "$R_PUB" ] && [ -n "$P_PUB" ] || die "could not read node pubkeys"
savevar R_PUB "$R_PUB"; savevar P_PUB "$P_PUB"
log "R_PUB=$R_PUB"; log "P_PUB=$P_PUB"

# ---- 4. fund (automated from deployer account) ----
R_ADDR=$("$CLI" info node_info --url "$R_URL" -o json | node "$SCRIPT_DIR/fnn-addr.mjs") || die "R address derivation failed"
P_ADDR=$("$CLI" info node_info --url "$P_URL" -o json | node "$SCRIPT_DIR/fnn-addr.mjs") || die "P address derivation failed"
savevar R_ADDR "$R_ADDR"; savevar P_ADDR "$P_ADDR"
log "P_ADDR=$P_ADDR"
log "R_ADDR=$R_ADDR"

log "Funding nodes automatically using local testnet deployer account..."
node "$SCRIPT_DIR/fund-nodes.mjs" --p-addr "$P_ADDR" --r-addr "$R_ADDR" | tee -a "$LOG" || {
  echo "Automated funding failed, fallback to manual funding:"
  echo "  P: $P_ADDR"
  echo "  R: $R_ADDR"
  read -r _
}

# ---- 5. peer ----
if "$CLI" peer list_peers --url "$R_URL" -o json | grep -q "$P_PUB"; then log "peers already connected";
else
  R_MULTI=$( "$CLI" info node_info --url "$R_URL" -o json | jget addresses | tr -d '"[]' | tr ',' '\n' | grep 0.0.0.0 | head -n 1 | sed 's|0.0.0.0|127.0.0.1|' | tr -d ' ' )
  if [ -n "$R_MULTI" ]; then "$CLI" peer connect_peer --url "$P_URL" --address "$R_MULTI" | tee -a "$LOG";
  else "$CLI" peer connect_peer --url "$P_URL" --pubkey "$P_PUB" | tee -a "$LOG"; fi
fi

# ---- 6+7. channel ----
CID=$("$CLI" channel list_channels --url "$R_URL" -o json | jget channel_id | tr -d '"' | head -n 1)
STATE=$("$CLI" channel list_channels --url "$R_URL" -o json | grep -o "ChannelReady\|NegotiatingFunding\|CollaboratingFundingTx\|SigningCommitment\|AwaitingTxSignatures\|AwaitingChannelReady" | head -n 1)
if [ "$STATE" = "ChannelReady" ] && [ -n "$CID" ] && [ "$CID" != "null" ]; then
  log "channel already ready: $CID"
else
  log "opening channel P -> R (1000 CKB)"
  OPEN_OUT=$("$CLI" channel open_channel --url "$P_URL" --pubkey "$R_PUB" --funding-amount 100000000000 -o json | tee -a "$LOG") \
    || die "open_channel failed (P likely underfunded — check faucet confirmations, then re-run this script)"
  TEMPID=$(echo "$OPEN_OUT" | jget temporary_channel_id | tr -d '"')
  [ -n "$TEMPID" ] && [ "$TEMPID" != "null" ] || die "no temporary_channel_id in open output; see log"
  "$CLI" channel accept_channel --url "$R_URL" --temporary-channel-id "$TEMPID" --funding-amount 0 -o json | tee -a "$LOG"
  log "waiting for ChannelReady (funding confirmations; polls up to ~40 min)"
  CID=""; STATE=""
  for _ in $(seq 1 400); do
    OUT=$("$CLI" channel list_channels --url "$R_URL" -o json)
    STATE=$(echo "$OUT" | grep -o "ChannelReady\|NegotiatingFunding\|CollaboratingFundingTx\|SigningCommitment\|AwaitingTxSignatures\|AwaitingChannelReady" | head -n 1)
    CID=$(echo "$OUT" | jget channel_id | tr -d '"' | head -n 1)
    [ "$STATE" = "ChannelReady" ] && break; sleep 6
  done
  [ "$STATE" = "ChannelReady" ] || die "channel not ready (last state: $STATE). Check funding + logs, then re-run."
  log "channel ready: $CID"
fi
savevar CID "$CID"

# ---- 8. cases ----
mkhash() { P=$(openssl rand -hex 32); H=$(echo -n "$P" | xxd -r -p | openssl dgst -sha256 -hex | awk '{print $2}'); echo "0x$P 0x$H"; }
newinv() { "$CLI" invoice new_invoice --url "$R_URL" --amount "$1" --currency Fibt --payment-hash "$2" --hash-algorithm sha256 --description "$3" ${4:+--expiry "$4"} ${5:+--final-expiry-delta "$5"} -o json | tee -a "$LOG"; }

read -r PREIMAGE PAYHASH <<< "$(mkhash)"; savevar H1 "$PAYHASH"
log "CASE 1 hold creation"; INV=$(newinv 1000000000 "$PAYHASH" spike-case-1 86400)
INVADDR=$(echo "$INV" | jget invoice_address | tr -d '"'); savevar INV1 "$INVADDR"
"$CLI" invoice get_invoice --url "$R_URL" --payment-hash "$PAYHASH" -o json | tee -a "$LOG"

log "CASE 2 payer submission (dry-run then pay)"
"$CLI" payment send_payment --url "$P_URL" --invoice "$INVADDR" --dry-run -o json | tee -a "$LOG"
"$CLI" payment send_payment --url "$P_URL" --invoice "$INVADDR" --timeout 120 --max-fee-amount 100000 -o json | tee -a "$LOG"

log "CASE 3 observe, settle, re-observe"
"$CLI" invoice get_invoice --url "$R_URL" --payment-hash "$PAYHASH" -o json | tee -a "$LOG"
"$CLI" payment get_payment --url "$P_URL" --payment-hash "$PAYHASH" -o json | tee -a "$LOG"
"$CLI" invoice settle_invoice --url "$R_URL" --payment-hash "$PAYHASH" --payment-preimage "$PREIMAGE" -o json | tee -a "$LOG"
"$CLI" invoice get_invoice --url "$R_URL" --payment-hash "$PAYHASH" -o json | tee -a "$LOG"
"$CLI" payment get_payment --url "$P_URL" --payment-hash "$PAYHASH" -o json | tee -a "$LOG"

read -r _ P2 <<< "$(mkhash)"; savevar H2 "$P2"
log "CASE 4 mismatched secret (expect rejection, invoice unchanged)"
newinv 1000000000 "$P2" spike-case-4 86400 > /dev/null
I4=$("$CLI" invoice new_invoice --url "$R_URL" --amount 1000000000 --currency Fibt --payment-hash "$P2" --hash-algorithm sha256 --description spike-case-4-pay --expiry 86400 -o json 2>/dev/null | jget invoice_address | tr -d '"' || true)
"$CLI" payment send_payment --url "$P_URL" --invoice "$I4" --timeout 120 --max-fee-amount 100000 -o json | tee -a "$LOG" || log "case4 pay failed (recorded)"
"$CLI" invoice settle_invoice --url "$R_URL" --payment-hash "$P2" --payment-preimage "$PREIMAGE" -o json | tee -a "$LOG" || log "case4 settle rejected (expected — recorded)"
"$CLI" invoice get_invoice --url "$R_URL" --payment-hash "$P2" -o json | tee -a "$LOG"

log "CASE 5 duplicates (record exact behavior)"
"$CLI" payment send_payment --url "$P_URL" --invoice "$INVADDR" --timeout 60 --max-fee-amount 100000 -o json | tee -a "$LOG" || log "case5 resend failed (recorded)"
"$CLI" invoice settle_invoice --url "$R_URL" --payment-hash "$PAYHASH" --payment-preimage "$PREIMAGE" -o json | tee -a "$LOG" || log "case5 re-settle failed (recorded)"

read -r _ P3 <<< "$(mkhash)"; savevar H3 "$P3"
log "CASE 6 cancel while Open, then pay (expect pay failure)"
newinv 1000000000 "$P3" spike-case-6 86400 > /dev/null
I6=$("$CLI" invoice new_invoice --url "$R_URL" --amount 1000000000 --currency Fibt --payment-hash "$P3" --hash-algorithm sha256 --description spike-case-6b --expiry 86400 -o json 2>/dev/null | jget invoice_address | tr -d '"' || true)
"$CLI" invoice cancel_invoice --url "$R_URL" --payment-hash "$P3" -o json | tee -a "$LOG"
"$CLI" payment send_payment --url "$P_URL" --invoice "$I6" --timeout 60 --max-fee-amount 100000 -o json | tee -a "$LOG" || log "case6 pay-against-cancelled failed (expected — recorded)"

read -r _ P4 <<< "$(mkhash)"; savevar H4 "$P4"
log "CASE 7 cancel AFTER hold (must fail outside Open; do not retry)"
I7=$("$CLI" invoice new_invoice --url "$R_URL" --amount 1000000000 --currency Fibt --payment-hash "$P4" --hash-algorithm sha256 --description spike-case-7 --expiry 86400 -o json | jget invoice_address | tr -d '"')
"$CLI" payment send_payment --url "$P_URL" --invoice "$I7" --timeout 120 --max-fee-amount 100000 -o json | tee -a "$LOG"
"$CLI" invoice cancel_invoice --url "$R_URL" --payment-hash "$P4" -o json | tee -a "$LOG" || log "case7 cancel-after-hold rejected (expected — recorded)"
"$CLI" invoice get_invoice --url "$R_URL" --payment-hash "$P4" -o json | tee -a "$LOG"

read -r _ P5 <<< "$(mkhash)"; savevar H5 "$P5"
log "CASE 8 timeout setup (pay, do NOT settle — recording happens 16h+ later)"
I8=$("$CLI" invoice new_invoice --url "$R_URL" --amount 1000000000 --currency Fibt --payment-hash "$P5" --hash-algorithm sha256 --description spike-case-8 --expiry 86400 --final-expiry-delta 57600000 -o json | jget invoice_address | tr -d '"')
"$CLI" payment send_payment --url "$P_URL" --invoice "$I8" --timeout 120 --max-fee-amount 100000 -o json | tee -a "$LOG"

read -r PRE6 P6 <<< "$(mkhash)"; savevar H6 "$P6"
log "CASE 9 crash/restart (R stopped, restarted, then settle)"
I9=$("$CLI" invoice new_invoice --url "$R_URL" --amount 1000000000 --currency Fibt --payment-hash "$P6" --hash-algorithm sha256 --description spike-case-9 --expiry 86400 -o json | jget invoice_address | tr -d '"')
"$CLI" payment send_payment --url "$P_URL" --invoice "$I9" --timeout 120 --max-fee-amount 100000 -o json | tee -a "$LOG"
RPID=$(pgrep -f "nodeR-data" | head -n 1)
[ -n "$RPID" ] || die "node R process not found; cannot run crash test"
kill "$RPID"
for _ in $(seq 1 20); do kill -0 "$RPID" 2>/dev/null || break; sleep 1; done
kill -0 "$RPID" 2>/dev/null && die "node R would not stop (pid $RPID); stop it manually and re-run"
log "node R stopped; restarting with the same data dir"
(cd "$SPIKE_DIR" && nohup ./fnn -c nodeR-config/config.yml -d nodeR-data > nodeR-data.log 2>&1 &)
for _ in $(seq 1 50); do rpc_up "$R_URL" && break; sleep 6; done
rpc_up "$R_URL" || die "node R did not restart"
"$CLI" invoice get_invoice --url "$R_URL" --payment-hash "$P6" -o json | tee -a "$LOG"
"$CLI" invoice settle_invoice --url "$R_URL" --payment-hash "$P6" --payment-preimage "$PRE6" -o json | tee -a "$LOG"
"$CLI" invoice get_invoice --url "$R_URL" --payment-hash "$P6" -o json | tee -a "$LOG"
"$CLI" payment get_payment --url "$P_URL" --payment-hash "$P6" -o json | tee -a "$LOG"

log "DONE. Cases 1-7+9 logged to $LOG."
log "In 16h+, run:  bash $SCRIPT_DIR/fnn-spike.sh check-expiry"
log "Then send back: $LOG + spike.vars (preimage/hash pairs are testnet-spike-only, safe to share)."
