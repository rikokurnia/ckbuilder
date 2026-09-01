import { setSporeConfig, createSpore, predefinedSporeConfigs, updateWitnessArgs, defaultEmptyWitnessArgs, isScriptValueEquals } from "@spore-sdk/core";
import { hd, helpers, RPC, commons } from "@ckb-lumos/lumos";

const SENDER_PRIVKEY = "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574";
const RPC_URL = "https://testnet.ckb.dev";

// Use official Spore Testnet configuration
const sporeConfig = {
  ...predefinedSporeConfigs.Testnet,
  ckbNodeUrl: RPC_URL,
  ckbIndexerUrl: RPC_URL,
};
setSporeConfig(sporeConfig);

function createDefaultLockWallet(privateKey) {
  const config = sporeConfig;
  const defaultLock = config.lumos.SCRIPTS.SECP256K1_BLAKE160;
  const lock = {
    codeHash: defaultLock.CODE_HASH,
    hashType: defaultLock.HASH_TYPE,
    args: hd.key.privateKeyToBlake160(privateKey),
  };

  const address = helpers.encodeToAddress(lock, {
    config: config.lumos,
  });

  function signMessage(message) {
    return hd.key.signRecoverable(message, privateKey);
  }

  function signTransaction(txSkeleton) {
    const signingEntries = txSkeleton.get("signingEntries");
    const inputs = txSkeleton.get("inputs");
    let witnesses = txSkeleton.get("witnesses");
    const signatures = new Map();

    for (let i = 0; i < signingEntries.size; i++) {
      const entry = signingEntries.get(i);
      if (entry.type === "witness_args_lock") {
        const input = inputs.get(entry.index);
        if (!input || !isScriptValueEquals(input.cellOutput.lock, lock)) {
          continue;
        }

        if (!signatures.has(entry.message)) {
          const sig = signMessage(entry.message);
          signatures.set(entry.message, sig);
        }

        const signature = signatures.get(entry.message);
        const witness = witnesses.get(entry.index, defaultEmptyWitnessArgs);
        witnesses = witnesses.set(
          entry.index,
          updateWitnessArgs(witness, "lock", signature)
        );
      }
    }
    return txSkeleton.set("witnesses", witnesses);
  }

  async function signAndSendTransaction(txSkeleton) {
    txSkeleton = commons.common.prepareSigningEntries(txSkeleton, {
      config: config.lumos,
    });
    txSkeleton = signTransaction(txSkeleton);
    const tx = helpers.createTransactionFromSkeleton(txSkeleton);
    const rpc = new RPC(config.ckbNodeUrl);
    return await rpc.sendTransaction(tx, "passthrough");
  }

  return {
    lock,
    address,
    signAndSendTransaction,
  };
}

async function main() {
  console.log("Initializing Spore DOB creation on CKB Testnet...");
  const wallet = createDefaultLockWallet(SENDER_PRIVKEY);
  console.log(`Creator Address: ${wallet.address}`);

  const sampleDobData = {
    dna: "CKBuilder-Week1-SporeDOB",
    symbol: "DOB#1",
    attributes: {
      type: "Genesis",
      builder: "RikoKurnia",
    },
    timestamp: Date.now(),
  };
  const dobPayload = Buffer.from(JSON.stringify(sampleDobData), "utf-8");

  console.log(`\nCreating Spore DOB with payload:`, sampleDobData);

  const { txSkeleton, outputIndex } = await createSpore({
    data: {
      contentType: "application/json",
      content: dobPayload,
    },
    toLock: wallet.lock,
    fromInfos: [wallet.address],
    config: sporeConfig,
  });

  console.log("Broadcasting Spore creation transaction...");
  const txHash = await wallet.signAndSendTransaction(txSkeleton);

  const sporeId = txSkeleton.get("outputs").get(outputIndex).cellOutput.type.args;
  console.log(`\n🎉 Spore DOB Successfully Created!`);
  console.log(`Transaction Hash: ${txHash}`);
  console.log(`Spore ID: ${sporeId}`);
  console.log(`Explorer Link: https://pudge.explorer.nervos.org/transaction/${txHash}`);

  console.log("\nWaiting for on-chain confirmation...");
  while (true) {
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: 2,
        jsonrpc: "2.0",
        method: "get_transaction",
        params: [txHash],
      }),
    });
    const json = await res.json();
    const txStatus = json?.result?.tx_status;
    if (txStatus && txStatus.status === "committed") {
      const blockNum = parseInt(txStatus.block_number, 16);
      console.log(`✅ Spore DOB Committed in block ${blockNum} (${txStatus.block_hash})`);
      break;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

main().catch(console.error);
