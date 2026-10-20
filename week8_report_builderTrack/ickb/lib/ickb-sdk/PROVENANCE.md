# Vendored iCKB SDK source

This directory is a verbatim copy of `sdk/src` from the iCKB stack repository.

- Repository: https://github.com/ickb/stack
- Branch: `master`
- Pinned commit: `9582ab441e64aff304a3af2be70e86713a645169` (2026-10-15)
- Source path: `sdk/src`
- License: MIT (see `LICENSE`)
- Runtime dependency: `@ckb-ccc/core@1.23.0`

The rewritten SDK (`9000.x` API) is not published on npm, so the report vendors the
source at a pinned commit and imports it directly. The legacy npm package
`@ickb/sdk@1000.0.82` is intentionally out of scope.

Do not edit files in this directory. Re-copy from the pinned commit to update.
