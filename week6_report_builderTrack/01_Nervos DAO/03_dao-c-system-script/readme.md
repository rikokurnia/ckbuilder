# ⚙️ 03 - dao.c System Script + Withdraw Phase 1

> **On-chain C enforcement of RFC 0023: `validate_withdrawing_cell` + `calculate_dao_input_capacity` + live phase-1 tx**
> Source: [ckb-system-scripts/c/dao.c](https://github.com/nervosnetwork/ckb-system-scripts/blob/master/c/dao.c) (644 lines)

---

## 🌟 Executive Summary

`dao.c` runs as the DAO cell **type script** and loops all inputs/outputs in one execution group (args must be empty, max 64 DAO outputs). Key gates replicated and verified:

1. **Deposit vs withdrawing split**: input data `0x00..00` = deposit (must emit withdrawing at same index); data `>0` = withdrawing (profit path).
2. **`validate_withdrawing_cell`**: output type hash == DAO, capacity equal, data == deposit block number u64 LE.
3. **`calculate_dao_input_capacity`**: header_deps deposit index from witness `input_type` (8-byte LE), deposit/withdraw AR (`dao[8:16]`), occupied vs counted (`c_t - c_o`), overflow-checked `counted * AR_n / AR_m + c_o`, 180-epoch `since` (`0x20` flag + absolute epoch).
4. **Final invariant**: `sum(outputs) <= sum(inputs + DAO interest)`, else `ERROR_INCORRECT_CAPACITY`.

We executed **phase 1** on the deposit from module 02: `150 CKB` deposit -> same-capacity withdrawing cell storing `#22658322` LE.

---

## 🔗 On-Chain Testnet Verification Proof

| Parameter | Value / Details |
| :--- | :--- |
| **Network** | CKB Public Testnet (Pudge) |
| **Phase-1 Tx Hash** | [`0x0622873cab21248e9e70bda8cca39b09f09b493277136dcef407ed22343eaf4d`](https://pudge.explorer.nervos.org/transaction/0x0622873cab21248e9e70bda8cca39b09f09b493277136dcef407ed22343eaf4d) |
| **Block Number** | `22,658,338` |
| **Block Hash** | `0x934df6b1ecace553b21f47724b233c650aa6c557fc896399a7a93ebcd54b2a6f` |
| **Input** | `0x9f8978a24370f30254ad1c64ffcd86c9265e9994976430ef43fa7e7cf2fe7ae4:0x0` (deposit cell) |
| **headerDeps[0]** | `0x84e636ce15c1e1a79eee26cb57805f0d6083cb31fdfd1800cd5bc69fc776d94c` (deposit block) |
| **Output data** | `0x12bd590100000000` (= #22658322 LE, deposit block) |
| **Epoch @ request** | `13959 + 401/1800`, AR `11927336899277601` |
| **Counted / accrued** | `48 CKB` counted, `0.00000409 CKB` accrued (not yet claimable) |
| **Claim epoch** | `14139 + 385/1800` (deposit + 180, ~30 days) |
| **Status** | 🟢 `committed` |

---

## 📸 Screenshots & Proof of Work

> Save terminal capture as `./images/foto-3.png`.

---

## ⚙️ Step-by-Step (maps to dao.c)

1. Fetch deposit tx, assert `outputs_data[0] == 0x0000000000000000` (else already withdrawn).
2. `numLeToBytes(22658322, 8)` = `0x12bd590100000000` for withdrawing data.
3. `Transaction.from({ headerDeps: [depositBlockHash], inputs: [depositOutPoint], outputs: [sameCellOutput], outputsData: [blockLE] })` + `addCellDepsOfKnownScripts(NervosDao)`.
4. `completeInputsByCapacity` + `completeFeeBy(1500)` -> broadcast -> poll commit.
5. Post-check: `calcDaoProfit(counted, depositHeader, withdrawHeader)` + `calcDaoClaimEpoch` match `dao.c` formula; phase-2 gated by `since`.

## 💻 Terminal Execution Output

```text
=================================================================
🟢 WEEK6-03: DAO.C + WITHDRAW PHASE 1 - DEPOSIT -> WITHDRAWING
=================================================================
📦 Deposit included in block #22658322 hash=0x84e636ce15c1e1a79eee26cb57805f0d6083cb31fdfd1800cd5bc69fc776d94c
   Epoch @ deposit: 13959 + 385/1800
   AR @ deposit   : 11927335881881919
   input capacity : 0x37e11d600 (150 CKB)
   withdrawing data (block LE): 0x12bd590100000000 (= #22658322)
🎉 PHASE-1 BROADCAST SUCCESSFUL!
🔗 Tx Hash: 0x0622873cab21248e9e70bda8cca39b09f09b493277136dcef407ed22343eaf4d
✅ Committed in block #22658338
   Epoch @ withdraw-request: 13959 + 401/1800
   AR @ withdraw-request  : 11927336899277601
   counted (c_t - c_o): 48 CKB
   accrued so far     : 0.00000409 CKB (not yet claimable)
   claim epoch        : {"integer":"14139","numerator":"385","denominator":"1800"}
   ⚠️ Phase-2 requires since >= claim epoch (~180 epochs after deposit).
🏁 Week6-03 Phase-1 Complete!
```

## 🚀 Reproduction Guide

```bash
cd week6_report_builderTrack
DEPOSIT_TX_HASH=0x9f8978a24370f30254ad1c64ffcd86c9265e9994976430ef43fa7e7cf2fe7ae4 \
  node "01_Nervos DAO/03_dao-c-system-script/scripts/dao_phase1_demo.js"
```
