import { ccc } from "@ckb-ccc/core";
import {
  CAP,
  ISSUE_AMOUNT,
  ckbToShannons,
  RECIPIENT_FUNDING,
  RECIPIENT_PRIVATE_KEY,
  TOKEN_CELL_CAPACITY,
  decodeXudtData,
  encodeExtensionArgs,
  explorerAddress,
  explorerTx,
  findTokenCells,
  getKnownXudt,
  getXudtType,
  loadState,
  makeClient,
  makeSigner,
  saveState,
  u128LE,
  waitCommitted,
} from "../../scripts/common.mjs";

const FORCE = process.env.FORCE === "1";

function line(title) {
  console.log(`\n== ${title} ==`);
}

async function main() {
  const client = makeClient();
  const owner = await makeSigner(client);
  const recipient = await makeSigner(client, RECIPIENT_PRIVATE_KEY);
  const state = loadState();
  if (!state?.extension) {
    throw new Error("missing extension in deployment.testnet.json; run deploy_extension.mjs first");
  }

  line("accounts");
  console.log(`owner:      ${owner.address}`);
  console.log(`owner hash: ${owner.lockHash}`);
  console.log(`holder:     ${recipient.address}`);
  console.log(`holder hash:${recipient.lockHash}`);
  console.log(`owner bal:  ${ccc.fixedPointToString(await owner.signer.getBalance())} CKB`);
  console.log(`holder bal: ${ccc.fixedPointToString(await recipient.signer.getBalance())} CKB`);

  const extensionScript = ccc.Script.from({
    codeHash: state.extension.codeHash,
    hashType: state.extension.hashType,
    args: u128LE(CAP),
  });
  const typeArgs = encodeExtensionArgs({
    ownerLockHash: owner.lockHash,
    cap: CAP,
    extensionScripts: [extensionScript],
  });
  const type = await getXudtType(client, typeArgs);
  const typeHash = await type.hash();

  line("token type");
  console.log(`type args:  ${typeArgs}`);
  console.log(`type hash:  ${typeHash}`);
  console.log(`extension:  ${extensionScript.codeHash} (${extensionScript.hashType})`);
  console.log(`ext args:   ${extensionScript.args} (cap ${CAP})`);

  const existing = await findTokenCells(client, type);
  if (existing.length > 0 && !FORCE) {
    console.log(`\nToken already exists in ${existing.length} cell(s). Set FORCE=1 to mint more.`);
    for (const c of existing) {
      console.log(`  ${c.outPoint.txHash}:${c.outPoint.index} = ${decodeXudtData(c.outputData).amount}`);
    }
    return;
  }

  const known = await getKnownXudt(client);
  const extensionDep = ccc.CellDep.from({
    outPoint: state.extension.outPoint,
    depType: "code",
  });

  const tx = ccc.Transaction.from({
    outputs: [
      {
        lock: recipient.lock,
        type,
        capacity: ckbToShannons(TOKEN_CELL_CAPACITY),
      },
      {
        lock: recipient.lock,
        capacity: ckbToShannons(RECIPIENT_FUNDING),
      },
    ],
    outputsData: [u128LE(ISSUE_AMOUNT), "0x"],
    cellDeps: [...known.cellDeps.map((c) => c.cellDep), extensionDep],
  });

  line("balancing");
  await tx.completeInputsByCapacity(owner.signer);
  await tx.completeFeeBy(owner.signer, 1500n);
  console.log(`inputs:  ${tx.inputs.length}`);
  console.log(`outputs: ${tx.outputs.length}`);
  console.log(`fee:     ${ccc.fixedPointToString(await tx.getFee(client))} CKB`);
  console.log("owner mode: owner input is present, so xUDT passes is_owner_mode=1");

  if (process.env.DRY_RUN === "1") {
    console.log("\nDRY_RUN=1: transaction built and balanced, not broadcast");
    return;
  }

  line("broadcast");
  const txHash = await owner.signer.sendTransaction(tx);
  console.log(`tx:        ${txHash}`);
  console.log(`explorer:  ${explorerTx(txHash)}`);

  line("wait for commit");
  const committed = await waitCommitted(txHash);
  console.log(`\nstatus:    ${committed.status}`);
  console.log(`block:     ${committed.blockNumber}`);

  const tokenCell = await client.getCellLive({ txHash, index: 0 }, true);
  if (!tokenCell) {
    throw new Error("token cell is not live");
  }
  const decoded = decodeXudtData(tokenCell.outputData);
  console.log(`token cell: ${txHash}:0`);
  console.log(`holder:     ${await tokenCell.cellOutput.lock.hash()}`);
  console.log(`amount:     ${decoded.amount} units`);
  console.log(`capacity:   ${ccc.fixedPointToString(tokenCell.cellOutput.capacity)} CKB`);
  if (decoded.amount !== ISSUE_AMOUNT) {
    throw new Error("minted amount mismatch");
  }

  state.token = {
    typeArgs,
    typeHash,
    amount: ISSUE_AMOUNT.toString(),
    mintTx: txHash,
    blockNumber: committed.blockNumber,
    holderAddress: recipient.address,
    holderLockHash: recipient.lockHash,
    ownerLockHash: owner.lockHash,
    extensionCodeHash: state.extension.codeHash,
    cap: CAP.toString(),
  };
  saveState(state);

  line("saved");
  console.log(JSON.stringify(state.token, null, 2));
  console.log(`\nholder explorer: ${explorerAddress(recipient.address)}`);
}

main().catch((e) => {
  console.error("\nExecution error:", e);
  process.exit(1);
});
