# 04 - xUDT RFC Conformance

This section maps the executed work onto [RFC-0052 "Extensible UDT"](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0052-extensible-udt/0052-extensible-udt.md) and states, clause by clause, what is proven and what is not.

The mapping is produced by a script, not written by hand:

```bash
node xudt/04_xudt-rfc/scripts/rfc_conformance_check.js
```

Current result: **8 PASS, 5 DEFERRED, 0 FAIL**. The machine-readable output is in `scripts/rfc_conformance_result.json`.

---

## 1. Conformance Matrix

| ID | RFC clause | Verdict | Evidence |
|---|---|---|---|
| RFC-1 | Cell data begins with a uint128 little-endian amount | PASS | Mint cell decodes to 2,000; transfer outputs decode to 500 and 1,500 |
| RFC-2 | `type.args` starts with the 32-byte owner lock hash | PASS | `0xcd61...bb0f`, equal to the owner lock hash used by the signer |
| RFC-3 | `flags & 0x1FFFFFFF = 1` selects a raw `ScriptVec` in args | PASS | Flags decode to `1` |
| RFC-4 | `ScriptVec` decodes to extension scripts | PASS | One entry: code hash `0x8505...`, hash type `data1`, args = cap 1000 |
| RFC-5 | The extension code cell hashes to its `data1` code hash | PASS | blake2b-256 of the live cell data equals `0x8505...` |
| RFC-6 | Owner mode via an owner-lock input authorizes issuance | PASS | Mint input carries the owner lock; 2,000 units issued |
| RFC-7 | Non-owner transfer preserves supply and runs the extension | PASS | 500 + 1,500 = 2,000, no owner input, both locks present |
| RFC-8 | A transfer above the cap is rejected | PASS | 1,200-unit attempt rejected, `Inputs[0].Type`, error `-104` |
| RFC-9 | P2SH mode: `flags = 2`, blake160 in args, `ScriptVec` in witness | DEFERRED | Not implemented; only raw `flags = 1` is used |
| RFC-10 | Multiple extensions and per-extension `XudtData` | DEFERRED | One extension; cell data is exactly 16 bytes |
| RFC-11 | `owner_script` + `owner_signature` witness path | DEFERRED | Owner mode used an owner-lock input instead |
| RFC-12 | Owner-mode bits `0x20000000` / `0x40000000` / `0x80000000` | DEFERRED | Flags use only bit 0 |
| RFC-13 | Mainnet deployment | DEFERRED | Testnet (Pudge) only |

The script re-queries Pudge for the token type, the extension code cell, the mint transaction, and the transfer transaction. It fails loudly (`exit 1`) if any executed check regresses, so it doubles as a regression test for the live artifacts.

---

## 2. How Each Executed Clause Was Verified

### RFC-1 - Amount encoding

The xUDT script reads the amount as a native 128-bit little-endian value from the first 16 bytes of the cell data, so the check is a decode, not a re-implementation. The live cells decode to:

```text
mint cell      0xd0070000000000000000000000000000  ->  2000
transfer out 0 0xf4010000000000000000000000000000  ->   500
transfer out 1 0xdc0500000000000000000000000000000  ->  1500
```

### RFC-2 / RFC-3 - Owner hash and flags

`type.args` is 113 bytes:

```text
[0..32)   owner lock hash
[32..36)  flags = 0x00000001 (little-endian)
[36..113) molecule ScriptVec
```

The owner hash is compared against the hash of the lock script that signed the mint transaction, so this is an identity check, not a copy of the same constant.

### RFC-4 / RFC-5 - Extension identity

The `ScriptVec` entry is decoded with `ccc.ScriptVec.decode`, then the extension's `code_hash` is compared with the hash of the **live code cell** fetched from the out point recorded in `deployment.testnet.json`. The cell data is hashed with `ccc.hashCkb` and must equal the `data1` code hash. This proves the deployed bytes are the bytes the token points at.

### RFC-6 / RFC-7 - Owner mode and supply

The mint transaction's inputs are resolved back to their previous outputs and their lock hashes are compared with the owner hash; the same is done for the transfer transaction to confirm it carries **no** owner input. Supply is checked by decoding the group output amounts and comparing the sum with the minted amount.

### RFC-8 - Rejection

The rejected attempt produces no transaction hash, so the evidence is the validator error itself. `rejection-evidence.txt` stores the raw output, and the conformance script greps it for `error code -104`:

```text
Client request error TransactionFailedToVerify: Verification failed
Script(TransactionScriptError { source: Inputs[0].Type,
cause: ValidationFailure: see error code -104 ... })
```

The rejected case is deliberately chosen so that **supply conservation holds** (1,500 in; 1,200 + 300 out). The sUDT check therefore passes and the only component that can reject is the extension. That makes the error code attributable to the extension, not to the token core.

---

## 3. Deferred Clauses and Why

### RFC-9 - P2SH extension mode

With `flags & 0x1FFFFFFF == 2`, the type args carry a 20-byte blake160 hash of the `ScriptVec` and the real scripts travel in the `input_type` / `output_type` witness field. The xUDT script recomputes the hash and rejects on mismatch.

This report uses `flags = 1` because the raw mode keeps the extension script inside the type args, which is directly readable from the chain. The P2SH mode is strictly more private about the rule set, and the check script itself is a natural next step: it would need the `XudtWitness` molecule layout in the witness.

### RFC-10 - Multiple extensions and `XudtData`

The RFC allows several extension scripts, each paired with a `BytesVec` entry of per-cell extension data. The live token has one extension and the cell data is exactly the 16-byte amount, with no `XudtData` block. Adding a second extension would require the data vectors to line up by index, and the current C code ignores `extension_index`.

### RFC-11 - `owner_script` + `owner_signature`

The RFC allows owner mode without consuming an owner cell: the witness carries an `owner_script` whose blake2b hash equals the owner hash, plus a signature it can verify. The xUDT script runs that script as an extra extension and sets owner mode if it returns success. This report authorizes the owner with an owner-lock input instead, which is the simplest and most common path.

### RFC-12 - Optional owner-mode bits

`0x20000000` disables the input-lock owner check, `0x40000000` enables output-type owner checks, and `0x80000000` enables input-type owner checks. The deployed flags use only bit 0, so the xUDT script sees `flags & ~OWNER_MODE_MASK == 1` and takes the raw-`ScriptVec` branch.

### RFC-13 - Mainnet

Everything here is Pudge testnet. The RFC's mainnet xUDT deployment is referenced in the RFC itself (code hash `0x50bd8d66...`); this report did not deploy to mainnet and makes no claim about it.

---

## 4. Notes on the Conformance Method

- The script **re-reads the chain** every run. It does not trust the values in `deployment.testnet.json` except for the out points it needs to look up; the amounts, hashes, flags, and script contents are all re-derived.
- A `DEFERRED` row is not a pass. It records a clause that the report intentionally does not exercise, so the gap is visible instead of implied.
- The script exits non-zero if any executed check fails, so it is safe to wire into CI against a testnet fork.

---

## 5. Reproduce

```bash
cd week8_report_builderTrack
npm install
node xudt/04_xudt-rfc/scripts/rfc_conformance_check.js
```

Expected tail:

```text
RESULT: 8 pass, 5 deferred, 0 fail
```

Artifacts produced:

- `scripts/rfc_conformance_result.json` - full matrix with expected vs actual values.
- `scripts/rejection-evidence.txt` - raw validator output for the over-cap attempt.

---

## Screenshot Slot

Capture the terminal output of `node xudt/04_xudt-rfc/scripts/rfc_conformance_check.js` and save it as `images/foto-8.png`. The important frame is the final `RESULT: 8 pass, 5 deferred, 0 fail` line together with the matrix above it.
