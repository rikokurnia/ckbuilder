# ⚡ Fiber Network: Lightning-Compatible Payment Channels on CKB

**Name Builder**: Riko Kurnia Sandi  
**Week**: Week 2 (Lesson 10)  
**Track**: CKB Builder Track

---

## 🧭 Executive Summary

**Fiber Network** is a next-generation, high-throughput, Lightning Network-compatible Layer 2 off-chain payment network built natively on **Nervos CKB**. While CKB Layer 1 excels at secure, decentralized consensus and state storage verification via the **Cell Model**, Fiber enables:
- **Instant, Sub-Second Finality**: Payments settle off-chain in milliseconds.
- **Zero L1 Gas / Cycles for Transfers**: State transitions occur off-chain between peers without incurring Layer 1 mining fees or VM cycle limits.
- **Native Multi-Asset Support**: Uniquely supports routing both **native CKB** and **fungible tokens (sUDT / xUDT)** within the same payment channel framework.
- **Bitcoin Lightning Interoperability**: Compatible with Bitcoin Lightning Network primitives (HTLC / PTLC), opening atomic cross-chain swaps between Bitcoin and CKB.

---

## 🔬 Architectural Deep-Dive: Cell Model vs. UTXO Lightning

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                 CKB Fiber Network Multi-Hop Payment Architecture            │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Alice: Consumer]  ◄── P2P Off-Chain Channel ──►  [Bob: Routing Node]     │
│         │                                                  │                │
│         │ (HTLC: 120 CKB, Hash: H, Expiry: +100)           │ (HTLC: 120 CKB)│
│         ▼                                                  ▼                │
│   Layer 1 Anchor                                     [Charlie: Merchant]    │
│  [2-of-2 Funding Cell]                               (Reveals Preimage R)   │
│  Capacity: 1,500 CKB ◄── Cooperative Settle ── L1 Payout: Alice & Bob       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Pillars

| Feature | Bitcoin Lightning Network | Nervos CKB Fiber Network |
| :--- | :--- | :--- |
| **Base Layer Anchor** | 2-of-2 Multi-sig UTXO | 2-of-2 Multi-sig **Cell** (Capacity Locked) |
| **Asset Support** | BTC Only | **CKB + sUDT / xUDT (Multi-Token Channels)** |
| **Smart Contract VM** | Bitcoin Script (Limited OpCodes) | **CKB-VM (Full RISC-V 64-bit Turing Complete)** |
| **Routing Primitive** | HTLC / PTLC (Taproot) | **HTLC / PTLC with Custom CKB Type & Lock Scripts** |
| **Dispute Resolution** | CSV / CLTV Timelocks | **Epoch-Based & Block-Based Timelock Cells** |

---

## 🔄 The 6-Stage Fiber Channel Lifecycle

### 1. Channel Handshake & Parameter Negotiation
Peers connect via P2P transport, exchange public keys, and negotiate:
- Initial capacity commitment (e.g., Alice commits 1,000 CKB, Bob commits 500 CKB).
- Dust limits, fee allowances, and dispute delay timelocks (e.g., 100 blocks).

### 2. Layer 1 Funding Cell Assembly
- A CKB Layer 1 transaction is assembled that consumes the participants' live cells and produces a single **Funding Cell**.
- The Funding Cell is guarded by a **2-of-2 Multisig Lock Script** (or Musig2).
- Funds are only locked on Layer 1 after a designated confirmation depth (e.g., 6 blocks on Testnet).

### 3. Off-Chain Micropayment Streams
- For every payment, both peers exchange signed **Commitment Transactions** incrementing the state sequence ($N \to N+1$).
- Each old commitment state is rendered obsolete by revealing its **Revocation Key**.
- Transfers occur at the speed of P2P network latency with zero L1 cycle costs.

### 4. Multi-Hop HTLC (Hash Time-Locked Contract) Routing
- Enables Alice to pay Charlie through Bob without Bob being able to steal the funds.
- Charlie generates a cryptographic secret (Preimage $R$) and shares $H = \text{SHA256}(R)$ in an invoice.
- Payment hops are conditioned on presenting $R$ before the lock expiration block.

### 5. Watchtower & Fraud Invariant Enforcement
- If an offline peer or malicious actor attempts to broadcast an old commitment state (e.g., State #1 where they had more money), the honest peer or an automated **Watchtower** detects the on-chain submission.
- Using the revealed Revocation Secret for that state, the honest peer triggers the **Penalty / Justice Branch** on CKB-VM, confiscating 100% of the channel capacity.

### 6. Cooperative Channel Settlement
- When both peers wish to close the channel, they sign a single cooperative closing transaction.
- The 2-of-2 Funding Cell is consumed, and two output cells immediately release the final balances directly back to their individual L1 lock scripts without any dispute delay.

---

## 💻 Practical Simulation Suite (`scripts/`)

> 📂 **Project Directory**: [👉 Click here to inspect scripts/](./scripts)  
> 📄 **Simulation Code**: [👉 Click here to view fiber_simulation.ts](./scripts/src/fiber_simulation.ts)  
> 📦 **Dependencies**: [👉 Click here to view package.json](./scripts/package.json)

We implemented an interactive TypeScript testing suite validating the complete mathematical and cryptographic lifecycle of a Fiber payment channel.

### Live Simulation Terminal Output

```text
$ ts-node src/fiber_simulation.ts
╔══════════════════════════════════════════════════════════════════════════════════╗
║     ⚡ Nervos CKB Fiber Network (Lightning Layer 2) Channel Simulation Suite       ║
║          P2P Channel Lifecycle, HTLC Multi-Hop & Dispute Verification           ║
╚══════════════════════════════════════════════════════════════════════════════════╝

👥 [Phase 1: Channel Handshake & Negotiation]
   • Peer A: Alice (Client / Consumer)
     - Initial Committed Capacity: 1000 CKB
     - Layer 1 Lock Address      : ckt1qzda0cr08m85hc8jlnfp3zer7x...
   • Peer B: Bob (Service Provider / Merchant)
     - Initial Committed Capacity: 500 CKB
     - Layer 1 Lock Address      : ckt1qrejnmlar3r452tcg57gvq8pat...

🔗 [Phase 2: Layer 1 Funding Cell Assembly & Broadcast]
   • Channel ID (256-bit)   : 0x8b2f87dbadf60f4bdc092f244dff3702c31c3c17be6b11a13289d6cc2917f640
   • 2-of-2 Multisig Lock   : 0x1dd53d748c99a07670d0539a25db29ac49fed5888afa9af2f630d42be98fa255
   • Total Capacity Locked  : 1500 CKB (150,000,000,000 Shannons)
   • Simulated L1 Funding Tx: 0xa367b8f2686cde4a1cd2e9dd4e4ee3bc6126e7722f84fb460237729d509d0fe2
   • Layer 1 Confirmation   : 🟢 6 Confirmations on CKB Testnet (Pudge)

⚡ [Phase 3: High-Frequency Off-Chain Micropayments (0 Gas / Sub-second)]
   ⚡ [Payment #1] Alice ➔ Bob: 60 CKB (Cloud Compute Node Hourly Lease)
      • Updated Channel State: Alice = 940 CKB | Bob = 560 CKB
      • Revocation Commitment Hash: 0x16bc118a1bde38ff...
   ⚡ [Payment #2] Alice ➔ Bob: 40 CKB (AI Inference Model API Query)
      • Updated Channel State: Alice = 900 CKB | Bob = 600 CKB
      • Revocation Commitment Hash: 0x3ade6a0f4b74f20d...
   ⚡ [Payment #3] Bob ➔ Alice: 15 CKB (Bandwidth Rebate Cash-Back)
      • Updated Channel State: Alice = 915 CKB | Bob = 585 CKB
      • Revocation Commitment Hash: 0x3641f20b9bc9f938...
   ⚡ [Payment #4] Alice ➔ Bob: 80 CKB (Storage Proof Rent Extension)
      • Updated Channel State: Alice = 835 CKB | Bob = 665 CKB
      • Revocation Commitment Hash: 0x38cff92e09011168...

🔀 [Phase 4: Multi-Hop HTLC (Hash Time-Locked Contract) Routing]
   Scenario: Alice pays Charlie (3rd Party Content Creator) via Bob (Routing Node).
   1. Charlie generates payment invoice:
      • Payment Hash (SHA256) : 0x3b8aeb8e700f36b87da279b6e6f43f90f352746908c8bc98d3867c7a5e5e6b74
      • Amount                : 120 CKB
      • Lock Expiry           : Block Height + 100
   2. Alice locks 120 CKB in HTLC routed to Bob.
      • Pending HTLC locked in Channel State #5
      • Alice Reserved Balance: 715 CKB
   3. Charlie reveals secret Preimage to claim funds across route:
      • Preimage Received: "ckb-fiber-payment-preimage-secret-value-xyz-987"
      • Hash Verification: ✅ MATCHED
   4. HTLC settled successfully:
      • Final Net Balances: Alice = 715 CKB | Bob = 785 CKB

🛡️ [Phase 5: Watchtower & Fraud Invariant Verification]
   Scenario: Alice maliciously attempts to broadcast obsolete State #1 on Layer 1.
   • Cheater attempts to broadcast State #1 (Alice Balance: 940 CKB instead of current 715 CKB).
   • Watchtower checks on-chain commitment index.
   • Revocation Secret for State #1 is known by Bob: "revocation-secret-state-1-0x730bd0611ccd4a13"
   • Hash Check: VALID REVOCATION
   🚨 PENALTY TRIGGERED: Bob invokes Justice Transaction on Layer 1!
      - Entire 1,500 CKB channel capacity is forfeited and awarded to Bob.
      - Cheater (Alice) balance confiscated: 0 CKB.
   ✅ Game-theoretic security upheld via CKB-VM revocation logic.

🤝 [Phase 6: Cooperative Channel Settlement (Clean L1 Close)]
   Both parties agree on latest state and sign a closing transaction.
   • Consumed 2-of-2 Multisig Cell: 0xa367b8f2686cde4a1cd2e9dd4e4ee3bc6126e7722f84fb460237729d509d0fe2:0
   • Output Cell 0 (Alice Payout)  : 714.9995 CKB
   • Output Cell 1 (Bob Payout)    : 784.9995 CKB
   • Miner Fee                     : 0.001 CKB
   • Settlement Tx Hash            : 0x3de8bffa3de8aef473878d150a6ddb8fddf4d1717f3c07359450f2deb86574ab
   • Result                        : 🟢 100% Funds Successfully Reclaimed on Layer 1!

════════════════════════════════════════════════════════════════════════════════════
🎉 Fiber Network Channel Lifecycle Simulation Completed Successfully!
════════════════════════════════════════════════════════════════════════════════════
```

---

## 📸 Photo Gallery & Screenshots Placeholder

> 📁 **Images Directory**: [👉 Click here to explore images/](./images)

*Screenshot of the terminal execution output can be added into `images/` and referenced below:*
- `images/fiber_simulation_output.png`

---

## 🚀 Step-by-Step Reproduction Guide

### 1. Navigate to Scripts Directory
```bash
cd week2_report_builderTrack/02_payment-chanel/fiber-basic/scripts
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Run the Fiber Channel Lifecycle Simulation
```bash
pnpm run start
```

### 4. Build TypeScript Distribution
```bash
pnpm run build
```

---

## 🔗 Official References & Resources
- **Fiber World Documentation**: [👉 Click here to visit fiber.world/docs](https://www.fiber.world/docs)
- **Fiber Network GitHub Repository**: [👉 Click here to visit github.com/nervosnetwork/fiber](https://github.com/nervosnetwork/fiber)
- **Nervos RFCs (Payment Channels)**: [👉 Click here to inspect Nervos RFC Repository](https://github.com/nervosnetwork/rfcs)
