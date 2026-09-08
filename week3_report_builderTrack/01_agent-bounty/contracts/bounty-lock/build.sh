#!/usr/bin/env bash
set -e

echo "=== Building AgentBounty bounty-lock for RISC-V CKB-VM ==="
TARGET="riscv64imac-unknown-none-elf"

CC=clang cargo build --target "$TARGET" --release

OUTPUT_BIN="target/$TARGET/release/bounty-lock"
if [ -f "$OUTPUT_BIN" ]; then
    echo " Build Succeeded!"
    echo "Artifact: $OUTPUT_BIN"
    ls -lh "$OUTPUT_BIN"
    file "$OUTPUT_BIN"
else
    echo " Error: Output binary not found!"
    exit 1
fi
