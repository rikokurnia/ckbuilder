# 🎨 AgentBounty Frontend dApp

The interactive web interface for **AgentBounty**, built with **Next.js 14 (App Router)**, **Tailwind CSS**, and **CCC (`@ckb-ccc/connector-react`)**.

---

## 🎨 ColorHunt Palette Applied

The UI design is styled using the official ColorHunt theme [`#09637E`, `#088395`, `#7AB2B2`, `#EBF4F6`](https://colorhunt.co/palette/09637e0883957ab2b2ebf4f6):

| Token | Hex | UI Role |
| :--- | :---: | :--- |
| **Deep Teal** | `#09637E` | Brand headers, primary buttons, card border accents |
| **Cerulean Teal** | `#088395` | Interactive highlights, active badges, status indicators |
| **Soft Sage** | `#7AB2B2` | Subtitle text, secondary borders, progress bars |
| **Ice Clean White** | `#EBF4F6` | Canvas background, card surface, contrast highlights |

---

## ⚡ Features & Components

1. **CCC Wallet Connector ([`src/components/Navbar.tsx`](./src/components/Navbar.tsx))**:
   - Connects to Nervos CKB Testnet using `@ckb-ccc/connector-react`.
   - Supports JoyID, UniSat, OKX, and MetaMask.
   - Displays live CKB capacity balance and address derivation.
2. **Fiber Channel Telemetry Card ([`src/components/ChannelStatsCard.tsx`](./src/components/ChannelStatsCard.tsx))**:
   - Visualizes off-chain channel capacity distribution (Creator vs Worker).
   - Live metrics: 0.00 Gas, &lt;1ms settlement finality, Layer 1 `bounty-lock` RISC-V anchor.
3. **Bounty Marketplace Feed ([`src/components/BountyFeed.tsx`](./src/components/BountyFeed.tsx))**:
   - Real-time task listing with filter pills (`OPEN`, `IN_PROGRESS`, `COMPLETED`).
   - One-click autonomous agent deployment ("Dispatch Agent Worker").
4. **Interactive Hold Invoice Inspector ([`src/components/HoldInvoiceModal.tsx`](./src/components/HoldInvoiceModal.tsx))**:
   - Inspects HTLC state transitions (`OPEN` $\rightarrow$ `HELD` $\rightarrow$ `SETTLED`).
   - Displays target Payment Hash $H = \text{SHA-256}(P)$ and revealed secret Preimage $P$.
5. **Verified AI Delivery Report ([`src/components/ResultArtifactModal.tsx`](./src/components/ResultArtifactModal.tsx))**:
   - Displays the formatted security audit report produced by the **Autonomous Intelligence Node**.
   - Cryptographic settlement seal with on-chain proof verification.

---

## 🛠️ Development & Running Locally

```bash
# Install dependencies
npm install

# Run development server (Port 3005)
npm run dev

# Build production bundle
npm run build
```

Open [http://localhost:3005](http://localhost:3005) in your browser.
