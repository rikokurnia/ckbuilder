# 🔐 3.5 - Custom Hash-Lock Script & Full-Stack Next.js dApp

> **Developing, Unit Testing, and Deploying a Custom JavaScript Lock Script Contract with Next.js Frontend on Nervos CKB**  
> Reference Documentation: [Nervos Docs - Simple Lock](https://docs.nervos.org/docs/dapp/simple-lock) & [ckb-js-vm Smart Contracts](https://github.com/nervosnetwork/ckb-js-vm)

---

## 🌟 Overview
In the Nervos CKB Cell Model, asset ownership and spending permissions are governed entirely by **Lock Scripts**. Any transaction attempting to consume a live cell must execute the cell's Lock Script inside the CKB-VM (RISC-V) environment and return exit code `0`.

This module demonstrates building a custom **Hash-Lock Contract** in JavaScript/TypeScript compiled to QuickJS bytecode (`hash-lock.bc`), unit testing it with `ckb-testtool`, deploying it to the **CKB Public Testnet**, and interacting with it via a full-stack Next.js web application.

---

## 🔗 On-Chain Testnet Deployment Proof

| Parameter | Value / Details |
| :--- | :--- |
| **Network** | CKB Public Testnet (Pudge) |
| **Deployment Tx Hash** | [`0x85d55b173b7f38754a48342fcb79b0740d9d8d7407b014628edcee174b82e8dd`](https://pudge.explorer.nervos.org/transaction/0x85d55b173b7f38754a48342fcb79b0740d9d8d7407b014628edcee174b82e8dd) |
| **Contract OutPoint** | `0x85d55b173b7f38754a48342fcb79b0740d9d8d7407b014628edcee174b82e8dd:0` |
| **Code Hash** | `0xcd262cb39d9e83f63e5415a56a23982fb6ae79b993e3cf371c12fad71dd23519` |
| **Hash Type** | `data2` |
| **ckb-js-vm OutPoint** | `0x756fdaf0d1ba1d2e03dc13c71c967b24021bc054893a766ccee6879c468892d2:0` |
| **Deployer Address** | `ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwy0rpn3trq0sj2q6arv7xaq9w6m6xa0egxe8xvr` |
| **Status** | 🟢 `committed` |
| **Explorer Link** | [View Contract on CKB Explorer](https://pudge.explorer.nervos.org/transaction/0x85d55b173b7f38754a48342fcb79b0740d9d8d7407b014628edcee174b82e8dd) |

---

## 📸 Screenshots & Proof of Work
*(Add manual screenshot evidence below)*

### 1. Web Frontend UI (Next.js)
```
[Insert Simple Lock Web Frontend Screenshot Here]
```

### 2. Terminal Test & Deployment Output
```
[Insert Terminal Unit Test and Deployment Screenshot Here]
```

### 3. Explorer On-Chain Contract Verification
```
[Insert Explorer Contract Deployment View Screenshot Here]
```

---

## 🧠 Core Technical Implementation

### 1. Hash-Lock Contract Logic (`contracts/hash-lock/src/index.ts`)
```typescript
import * as bindings from "@ckb-js-std/bindings";
import { HighLevel, log, hashCkb, bytesEq } from "@ckb-js-std/core";

function main(): number {
  log.setLevel(log.LogLevel.Debug);

  // 1. Extract target expected hash from script args
  let expect_hash = new Uint8Array(HighLevel.loadScript().args).slice(35);

  // 2. Load secret preimage from WitnessArgs.lock
  let witness_args = HighLevel.loadWitnessArgs(0, bindings.SOURCE_GROUP_INPUT);
  let preimage = witness_args.lock!;

  // 3. Compute Blake2b hash of preimage
  let hash = hashCkb(preimage);

  // 4. Verify cryptographic equality
  if (!bytesEq(hash, expect_hash.buffer)) {
    log.error(`Check hash failed!`);
    return 11; // Non-zero exit rejects transaction
  }
  return 0; // Success unlocks cell
}

bindings.exit(main());
```

### 2. Contract Build & Bytecode Compilation
The contract is bundled using `esbuild` and compiled to CKB-VM bytecode using `ckb-debugger`:
```bash
npx esbuild --platform=neutral --minify --bundle --external:@ckb-js-std/bindings --target=es2022 contracts/hash-lock/src/index.ts --outfile=dist/hash-lock.js
ckb-debugger --read-file dist/hash-lock.js --bin node_modules/ckb-testtool/src/unittest/defaultScript/ckb-js-vm -- -c dist/hash-lock.bc
```

### 3. Off-Chain Unit Testing (`ckb-testtool`)
10 unit tests verify both successful unlock with valid preimage and instant rejection with wrong preimage:
```bash
npm test
```
```text
PASS tests/frontend-transaction.test.ts
PASS tests/hash-lock.mock.test.ts
Test Suites: 2 passed, 2 total
Tests:       10 passed, 10 total
```

---

## 🚀 How to Run

### Step 1: Build Contract & Run Unit Tests
```bash
npm install
npm run build
npm test
```

### Step 2: Deploy to CKB Testnet
```bash
npm run deploy -- --network testnet --privkey 0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574
```

### Step 3: Run Full-Stack Next.js Frontend
```bash
cd frontend
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the deployed Hash-Lock contract.
