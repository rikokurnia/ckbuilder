#!/usr/bin/env bash
set -e

# Target: CKB Public Testnet (Pudge)
RPC_URL="https://testnet.ckb.dev/rpc"

echo "=== [CKB-CLI] 1. Check Network & Tip Header ==="
ckb-cli --url "$RPC_URL" rpc get_tip_block_number
ckb-cli --url "$RPC_URL" rpc get_tip_header | head -n 25

echo ""
echo "=== [CKB-CLI] 2. Current Epoch Info ==="
ckb-cli --url "$RPC_URL" rpc get_current_epoch
