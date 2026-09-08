#!/usr/bin/env bash
set -e

RPC_URL="https://testnet.ckb.dev/rpc"
# Builder address from Week 1 (Omnilock Web3 Address)
ADDRESS="ckt1qrejnmlar3r452tcg57gvq8patctcgy8acync0hxfnyka35ywafvkqgj6nal3nydecn6saa67e0af9rpm0c4pne6qqxl6ue4"

echo "=== [CKB-CLI] Querying Total On-Chain Capacity for Address ==="
echo "Target Address: $ADDRESS"
echo ""

ckb-cli --url "$RPC_URL" wallet get-capacity --address "$ADDRESS"

echo ""
echo "=== [CKB-CLI] Inspecting Individual Live Cells (State & Data) ==="
ckb-cli --url "$RPC_URL" wallet get-live-cells --address "$ADDRESS" --limit 5
