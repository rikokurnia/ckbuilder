# AgentBounty Smart Contract (`bounty-lock`)

A bare-metal CKB lock script written in Rust targeting the **CKB-VM (RISC-V 64-bit)** with `#![no_std]` and `ckb-std v1.1.0`.

---

## Purpose & Design

The `bounty-lock` script secures escrowed bounty funds on CKB Layer 1 for the **AgentBounty** autonomous AI agent marketplace. It enforces a zero-trust conditional settlement logic:

1. **Path A: Agent Settlement (Cryptographic Preimage Claim)**:
   - When an autonomous AI worker submits verified work, it unlocks the escrow cell by providing the 32-byte secret preimage $P$ in the witness.
   - The contract verifies that $\text{SHA-256}(P) == \text{payment\_hash}$.
   - Upon verification, funds are released to the worker.
2. **Path B: Creator Timeout Refund**:
   - If the task is abandoned or the timeout expires, the original creator can reclaim 100% of the locked capacity without penalties.
3. **Capacity Conservation Invariant**:
   - Enforces that total output capacities do not exceed input capacities, preventing cell capacity leakage.

---

## Script Specification

### Script Args Layout (64+ Bytes)
```
[ 0..32  ] : creator_lock_hash (32-byte Blake2b hash of the creator's lock)
[ 32..64 ] : payment_hash     (32-byte SHA-256 hash H of the secret preimage P)
[ 64..72 ] : (Optional) timeout_epoch (8-byte unsigned integer)
```

### Witness Lock Layout
```
Byte 0      : Unlock Mode
              - 0x01: Agent Settlement via Preimage
              - 0x02: Creator Timeout Refund
Bytes 1..33 : 32-byte Preimage (Required for Mode 0x01)
```

---

## Build & Verification

Compiled directly to RISC-V ELF using `clang` and size-optimization flags:

```bash
# Run unit tests on host
cargo test

# Compile to RISC-V bare-metal ELF binary
./build.sh
```

- **Target Architecture**: `riscv64imac-unknown-none-elf`
- **Output Binary**: `target/riscv64imac-unknown-none-elf/release/bounty-lock`
- **Binary Size**: ~17 KB (static, stripped, zero-dependency)

---

## Phase 0 implementation-status note (14 September 2026)

`cargo test` now runs **4 host-side SHA-256 tests**, including the standard `abc` vector and an incremental multi-block vector. Source inspection confirms the following; the "Purpose & Design" section above is preserved as the original intent, not the verified behavior:

- `cargo test` exercises **only the standalone SHA-256 module on host**. No transaction executes in CKB-VM. There are no multi-block hash vectors and no transaction-level tests.
- **Path A (0x01)** verifies `SHA-256(preimage) == payment_hash` but constrains **no output**: any holder of the preimage can pay any recipient any amount, subject only to the global capacity check. It does not bind settlement to a worker or an agreed amount.
- **Path B (0x02)** performs **no creator-authority check** (`creator_lock_hash` is parsed and never used), **no timeout/`since` check** (the code comment says enforcement "could" be added), and **no refund-destination constraint**. Anyone can invoke a refund at any time.
- The capacity invariant is global output ≤ input (skipped when inputs sum to zero). It does not implement escrow-group accounting or fee-leakage limits.
- **Consequence:** do not fund this lock with valuable capacity. Independent L1 escrow is **deferred** for Phases 0–1 by operator decision; a redesign (creator authorization, worker/refund outputs, exact args/witness parsing, checked sums, `since` comparison, CKB-VM transaction tests) is required before any L1 rail is used.
