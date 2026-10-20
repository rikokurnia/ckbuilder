# Vendored headers

Minimal headers from `nervosnetwork/ckb-c-stdlib` needed to build a CKB
extension script:

- `ckb_consts.h`
- `ckb_syscall_apis.h`
- `ckb_raw_syscalls.h`
- `LICENSE`

Source: https://github.com/nervosnetwork/ckb-c-stdlib
Commit: `6bf2bca668e0db5f9eb120eb78b31782899ef90d` (master, fetched 2026-10-20)

`ckb_syscall_utils.h` is intentionally not vendored: it pulls in `<string.h>`,
which is unnecessary for this extension and complicates a freestanding build.
