# 🛠️ 02 - Getting Started with CKB & OffCKB

> **Practical Validation of CKB Quick Start and OffCKB Toolchain**  
> Documentation of setting up the CKB developer environment, compiling JavaScript smart contracts to bytecode, and deploying to the public CKB Testnet on-chain.

---

## 🌟 Quick Summary
This activity validates the core development workflow recommended in the official [Nervos Quick Start](https://docs.nervos.org/docs/getting-started/quick-start) and [OffCKB Guide](https://docs.nervos.org/docs/sdk-and-devtool/offckb).

- **Contract Name**: `hello-world`
- **Compiler / VM**: CKB JavaScript VM (`ckb-js-vm`) & `esbuild`
- **Target Network**: CKB Testnet (Pudge / Aggron)
- **Deployment Status**: 🟢 **Committed On-Chain**

---

## 🔗 On-Chain Testnet Deployment Proof

| Parameter | Value / Details |
| :--- | :--- |
| **Network** | CKB Public Testnet |
| **Transaction Hash** | [`0x1eedb40a9e1900c9d02b2d48aab414f4dd567b5e2bf683822ba1d7017bbb614a`](https://pudge.explorer.nervos.org/transaction/0x1eedb40a9e1900c9d02b2d48aab414f4dd567b5e2bf683822ba1d7017bbb614a) |
| **Block Number** | `22,271,363` (`0x153d583`) |
| **Deployer Address** | `ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwy0rpn3trq0sj2q6arv7xaq9w6m6xa0egxe8xvr` |
| **Status** | `committed` |
| **Explorer Link** | [View Transaction on CKB Explorer](https://pudge.explorer.nervos.org/transaction/0x1eedb40a9e1900c9d02b2d48aab414f4dd567b5e2bf683822ba1d7017bbb614a) |

---

## 📸 Screenshots & Proof of Work
*(Add manual screenshot evidence below)*

### 1. Faucet Claim (100,000 CKB)
```
[Insert Nervos Pudge Faucet Claim Screenshot Here]
```

### 2. Terminal Build & Deployment Logs
```
[Insert Terminal Deployment Output Screenshot Here]
```

### 3. Explorer On-Chain Verification
```
[Insert CKB Explorer Tx View Screenshot Here]
```

---

## ⚙️ Step-by-Step Practical Execution

### 1. Local Environment & Project Scaffolding
- Initialized local development toolchain via `@offckb/cli`.
- Created a fresh JavaScript smart contract project template:
  ```bash
  npx offckb create 02_get_started_ckb -l javascript
  ```

### 2. Contract Compilation (`ckb-js-vm`)
- Built contract source `contracts/hello-world/src/index.js` using `esbuild`.
- Emitted bundled JavaScript `dist/hello-world.js` and compiled bytecode `dist/hello-world.bc`.
  ```bash
  npm run build
  ```

### 3. Public Testnet Deployment
- Generated a testnet SECP256K1 key pair and funded via the Nervos Pudge Faucet.
- Executed on-chain deployment using `offckb deploy`:
  ```bash
  npm run deploy -- --network testnet --privkey <PRIVATE_KEY> --yes
  ```
- **Deployment Artifacts Generated**:
  - `deployment/scripts.json`
  - `deployment/testnet/hello-world.bc/deployment.toml`

---

## 💻 Deployment Log Output

```text
🚀 Deploying 1 contract(s): hello-world
   📁 Target: dist
   📄 Output: deployment
   🌐 Network: testnet
   🔑 Custom private key: provided

🚀 Deploying contracts...
💻 Running: offckb deploy --network testnet --target dist --output deployment --privkey 0x1afb...3574 --yes
🖥️  Platform: linux

🚀 Preparing to deploy 1 contract(s):
   📄 hello-world.bc

   📁 Deployment artifacts will be saved to: deployment
   🌐 Network: testnet
   🔑 Using custom private key
   🔄 Type ID: disabled (immutable)
contract hello-world.bc deployed, tx hash: 0x1eedb40a9e1900c9d02b2d48aab414f4dd567b5e2bf683822ba1d7017bbb614a
wait for tx confirmed on-chain...
tx committed.

📦 Saving deployment artifacts for 1 contract(s)...
- 📄 Saving artifacts for hello-world.bc...
- ✅ Successfully saved artifacts for hello-world.bc
- 📄 Script info file generated: deployment/scripts.json

🎉 All deployment artifacts saved successfully!
✅ Successfully deployed all contracts!
```

---

## 🔬 Local Devnet Comparison
Prior to testnet deployment, local chain validation was also tested on a local `offckb node`:
- **Local Devnet Tx Hash**: `0x6b50682bdb8bbca98390679251eca244c36d69e418b9c6ec2931082faa8e07ee`
