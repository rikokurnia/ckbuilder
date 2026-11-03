#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

CC=${CC:-clang}
LD=${LD:-ld.lld}
READELF=${READELF:-llvm-readelf}

CFLAGS=(
  --target=riscv64-unknown-elf
  -march=rv64imac
  -mabi=lp64
  -nostdlib
  -fPIC
  -O2
  -Wall
  -Wextra
  -fvisibility=hidden
  -fdata-sections
  -ffunction-sections
  -I ../vendor/ckb-c-stdlib
)

echo "== build object =="
"$CC" "${CFLAGS[@]}" -c transfer_cap.c -o transfer_cap.o

echo "== link shared object =="
"$LD" -shared --gc-sections -z norelro --no-rosegment -o transfer_cap.so transfer_cap.o

echo "== link static executable (deployed artifact) =="
"$LD" -static -e validate --export-dynamic --gc-sections -o transfer_cap.elf transfer_cap.o

echo "== inspect =="
"$READELF" -h transfer_cap.elf | grep -E "Class:|Machine:|Type:|Entry"
"$READELF" --syms transfer_cap.elf | grep -w validate
if "$READELF" -d transfer_cap.elf 2>/dev/null | grep -q NEEDED; then
  echo "unexpected dynamic dependency" >&2
  exit 1
fi

echo "== artifacts =="
ls -l transfer_cap.so transfer_cap.elf
sha256sum transfer_cap.so transfer_cap.elf
