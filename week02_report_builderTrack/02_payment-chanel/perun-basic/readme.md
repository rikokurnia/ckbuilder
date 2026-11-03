# 🌐 Perun Network: Generalized State Channels on Nervos CKB

**Name Builder**: Riko Kurnia Sandi  
**Week**: Week 2 (Lesson 10)  
**Track**: CKB Builder Track

---

## 🧭 Executive Summary

**Perun** is an academic-grade, generalized state channel framework developed by the Perun Network team (in collaboration with Bosch and TU Darmstadt) and implemented natively on **Nervos CKB**. While payment-only networks (like Bitcoin Lightning) strictly route token transfers, Perun extends off-chain channels into **generalized Turing-complete state machines**:
- **Turing-Complete Off-Chain Execution (App Channels)**: Arbitrary smart contracts, off-chain gaming, real-time DeFi matching, and complex collaborative protocols execute off-chain at zero gas cost.
- **Multi-Party Channels ($N \ge 2$)**: Supports multiple participants within a single channel allocation without quadratic pairwise channel overhead.
- **Virtual Channels**: Allows two participants who do not have a direct channel to open an instant virtual state channel routed through an intermediary node—without touching Layer 1 and without involving the intermediary in intermediate state updates.
- **Cross-Chain Interoperability**: Protocol-agnostic architecture enabling cross-chain state channels and atomic swaps between **Nervos CKB** and **Ethereum (EVM)**.
- **Two-Phase Dispute Protocol**: A formal on-chain challenge-response mechanism enforced by CKB Type Scripts to guarantee game-theoretic security.

---

## 🔬 Architectural Deep-Dive: Generalized State Channels on CKB

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                   Perun Generalized State Channel Architecture              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [Alice: Consumer]  ◄─────── Virtual Channel ───────►  [Carol: Provider]   │
│         │               (Zero Intermediary Overhead)          │             │
│         │                                                     │             │
│         ▼                                                     ▼             │
│    Direct Channel                                        Direct Channel     │
│         │                     [Bob: Intermediary]             │             │
│         └───────────────►  (Pass-Through Guarantor) ◄─────────┘             │
│                                       │                                     │
│   ════════════════════════════════════╪══════════════════════════════════   │
│                                       ▼                                     │
│                  CKB Layer 1 Anchor: Perun Channel Cell                     │
│   ├── Lock Script: Multi-Signature of all Channel Participants             │
│   ├── Type Script: Perun Dispute & Transition Verification (RISC-V)         │
│   └── Data Field : [ChannelID | Version | Balances | AppStateHash]          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Comparison: Perun vs. Fiber / Lightning

| Dimension | Bitcoin Lightning | CKB Fiber Network | CKB Perun Network |
| :--- | :--- | :--- | :--- |
| **Primary Scope** | Payments Only | Payments + sUDT / xUDT | **Generalized Smart Contract States (App Channels)** |
| **Participant Model** | Strict 2-Party (Bilateral) | Strict 2-Party (Bilateral) | **Multi-Party ($N \ge 2$) Support** |
| **Routing Mechanism** | Multi-hop HTLC (Hop-by-hop) | Multi-hop HTLC / PTLC | **Virtual Channels (Direct Sub-Channels)** |
| **Intermediary Role** | Signs every hop transfer | Signs every hop transfer | **Signs setup only; bypassed during updates** |
| **Dispute Model** | Revocation Keys & Penalties | Revocation Keys & Penalties | **Two-Phase Monotonic Version Challenge (Register / Refute)** |
| **Cross-Chain Target** | Bitcoin Only | CKB <-> Bitcoin Lightning | **CKB <-> Ethereum (EVM) Atomic Channels** |

---

## ⚖️ The Two-Phase Dispute Resolution Mechanism on CKB

Perun relies on a formal two-phase dispute resolution protocol anchored to a dedicated **Channel Cell** on CKB:

```text
[Off-Chain State v1, v2, v3...]
       │
       ▼ (Adversarial submission of obsolete State v1)
[1. REGISTER PHASE] ──► Channel Cell enters CHALLENGE_WINDOW (e.g. 20 blocks)
       │
       ▼ (Honest party submits newer signed State v3)
[2. REFUTE PHASE]   ──► Perun Type Script checks: Version(v3) > Version(v1) && Sigs == Valid
       │
       ▼ (Challenge window expires)
[3. FINALIZE]       ──► State v3 locked as Canonical; Settlement outputs distributed.
```

1. **Register Phase**: If a peer becomes unresponsive or malicious, any participant can broadcast a `Register` transaction presenting the latest signed state in their possession. The Channel Cell enters a challenge timelock window.
2. **Refute Phase**: Any other participant can submit a `Refute` transaction containing a strictly higher version number ($v_{\text{new}} > v_{\text{old}}$) accompanied by valid cryptographic signatures from all participants. The CKB Type Script updates the registered state.
3. **Settlement Phase**: After the challenge window elapses without further refutation, the state becomes finalized. A payout transaction consumes the Channel Cell and distributes the underlying CKB capacity.

---

## 💻 Practical Simulation Suite (`scripts/`)

> 📂 **Project Directory**: [👉 Click here to inspect scripts/](./scripts)  
> 📄 **Simulation Code**: [👉 Click here to view perun_simulation.ts](./scripts/src/perun_simulation.ts)  
> 📦 **Dependencies**: [👉 Click here to view package.json](./scripts/package.json)

We implemented an interactive TypeScript testing suite validating multi-party state channels, virtual channel instantiation, generalized off-chain app state transitions, and two-phase dispute refutations.

### Live Simulation Terminal Output

```text
$ ts-node src/perun_simulation.ts
╔══════════════════════════════════════════════════════════════════════════════════╗
║     🌐 Perun Generalized State Channels on Nervos CKB Simulation Suite           ║
║         Multi-Party Channels, Virtual Channels & Two-Phase Dispute Invariants   ║
╚══════════════════════════════════════════════════════════════════════════════════╝

👥 [Phase 1: Multi-Party State Channel Establishment (N = 3)]
   Participants & Committed Capacity:
   • Alice : 500 CKB | L1 Address: ckt1qzda0cr08m85hc8jlnfp3z...
   • Bob   : 300 CKB | L1 Address: ckt1qrejnmlar3r452tcg57gvq...
   • Carol : 200 CKB | L1 Address: ckt1qzda0cr08m85hc8jlnfp3z...

   • Generated Channel ID  : 0x8559f96380501425cc8d6fc984229683a90cdeb6f12a6da7a2bdb784ee01c8d0
   • Total Capacity Locked : 1000 CKB
   • CKB Layer 1 Anchor    : Channel Cell OutPoint [0x61b641193e8c16e17ebca0c8badfcf6accba41b5b888ec79d4b3862763718f22:0]
   • CKB Type Script Guard : Perun Channel Verification Script (Turing-Complete RISC-V)

🔀 [Phase 2: Virtual Channel Instantiation]
   Scenario: Alice and Carol open an off-chain sub-channel through Bob (Guarantor).
   • Advantage: Alice and Carol transact directly with 0 on-chain fees and 0 intermediary overhead.
   • Virtual Channel Capital Allocated: 150 CKB (Alice guarantees 100 CKB, Carol guarantees 50 CKB)
   • Status: 🟢 Virtual Channel Established Off-Chain

⚙️  [Phase 3: Generalized Off-Chain App State Machine Transitions]
   Transition 1: Alice executes AI compute job from Bob (50 CKB)
   • State v1: Alice = 450 CKB | Bob = 350 CKB | Carol = 200 CKB
   • App Data: "APP_PAYLOAD_AI_QUERY_EXECUTION"
   • Multi-Signatures: 3/3 Valid Cryptographic Signatures Collected
   Transition 2: Bob purchases data feed from Carol (30 CKB)
   • State v2: Alice = 450 CKB | Bob = 320 CKB | Carol = 230 CKB
   • Multi-Signatures: 3/3 Valid Cryptographic Signatures Collected
   Transition 3: Carol performs micropayment to Alice (20 CKB)
   • State v3 (Latest): Alice = 470 CKB | Bob = 320 CKB | Carol = 210 CKB
   • Multi-Signatures: 3/3 Valid Cryptographic Signatures Collected

⚖️  [Phase 4: Two-Phase Dispute Protocol on CKB Layer 1]
   Scenario: Alice goes offline / becomes adversarial and submits obsolete State v1 to L1.
   1. Alice broadcasts Register Transaction on CKB:
      • Submitted State Version : v1 (Alice claims 450 CKB)
      • CKB Perun Contract       : Enters CHALLENGE_WINDOW (Length: 20 blocks)
      • Timelock Cell Generated : Challenge expires at Block #22345800
   2. Bob detects obsolete state submission and files a Refutation:
      • Bob submits Refute Transaction with State v3
      • Perun Type Script Verification:
        - Is Version v3 > v1? : ✅ TRUE (3 > 1)
        - Are all 3 participant signatures valid? : ✅ VERIFIED (Alice, Bob, Carol)
   3. CKB Layer 1 Overwrites Pending State with v3:
      • Fraudulent attempt rejected. State v3 finalized as canonical on Layer 1.

🏁 [Phase 5: Layer 1 Settlement & Fund Release]
   Executing final settlement transaction on CKB consuming the Channel Cell:
   • Consumed Channel Cell: 0x61b641193e8c16e17ebca0c8badfcf6accba41b5b888ec79d4b3862763718f22:0
   • Output #0 [Alice Payout]: 470 CKB ➔ ckt1qzda0cr08m85hc8jlnfp3z...
   • Output #1 [Bob Payout]: 320 CKB ➔ ckt1qrejnmlar3r452tcg57gvq...
   • Output #2 [Carol Payout]: 210 CKB ➔ ckt1qzda0cr08m85hc8jlnfp3z...
   • Settlement Tx Hash    : 0xb84b7eb184cf4af4d977d461a412c9fac0738eea744b7aa181851130058c851c
   • Capacity Conservation : 1000 CKB in == 1000 CKB out (100% Conserved)

════════════════════════════════════════════════════════════════════════════════════
🎉 Perun State Channel Lifecycle & Dispute Verification Completed Successfully!
════════════════════════════════════════════════════════════════════════════════════
```

---

## 📸 Photo Gallery & Screenshots Placeholder

> 📁 **Images Directory**: [👉 Click here to explore images/](./images)

*Screenshot of the terminal execution output can be added into `images/` and referenced below:*
- `images/perun_simulation_output.png`

---

## 🚀 Step-by-Step Reproduction Guide

### 1. Navigate to Scripts Directory
```bash
cd week2_report_builderTrack/02_payment-chanel/perun-basic/scripts
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Run the Perun State Channel Simulation
```bash
pnpm run start
```

### 4. Build TypeScript Distribution
```bash
pnpm run build
```

---

## 🔗 Official References & Resources
- **Perun Network Official Site**: [👉 Click here to visit perun.network](https://perun.network/)
- **Perun CKB Smart Contract Repository**: [👉 Click here to inspect perun-network/perun-ckb-contract](https://github.com/perun-network/perun-ckb-contract)
- **Perun State Channels Whitepaper**: [👉 Click here to read the Perun Academic Paper](https://perun.network/whitepaper)
- **Nervos Developer Documentation**: [👉 Click here to visit docs.nervos.org](https://docs.nervos.org/)
