#!/usr/bin/env bash
set -e

echo "=== [CKB-CLI] List Local Keystore Accounts ==="
ckb-cli account list

echo ""
echo "=== [CKB-CLI] BIP-44 Extended Address Generation Example ==="
echo "To generate a new account non-interactively with a random password:"
echo "ckb-cli account new --password <YOUR_PASSWORD>"
