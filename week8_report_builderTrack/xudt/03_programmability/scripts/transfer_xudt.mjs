import { ccc } from "@ckb-ccc/core";
import {
  CAP,
  RECIPIENT_PRIVATE_KEY,
  ckbToShannons,
  SEND_OK,
  TOKEN_OUTPUT_CAPACITY,
  decodeXudtData,
  explorerTx,
  findTokenCells,
  getKnownXudt,
  getXudtType,
  loadState,
  makeClient,
  makeSigner,
  requireState,
  saveState,
  u128LE,
  waitCommitted,
} from "../../scripts/common.mjs";

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : process.argv[i + 1];
}

function line(title) {
  console.log(`\n== ${title} ==`);
}

async function main() {
  const amount = BigInt(arg("--amount", SEND_OK.toString()));
  const expectReject = process.argv.includes("--expect-reject");

  const client = makeClient();
  const holder = await makeSigner(client, RECIPIENT_PRIVATE_KEY);
  const owner = await makeSigner(client);
  const state = requireState();
  if (!state.token) {
    throw new Error("missing token in deployment.testnet.json; run issue_xudt.mjs first");
  }

  const type = await getXudtType(client, state.token.typeArgs);
  const cells = await findTokenCells(client, type);
  const candidates = cells
    .map((cell) => ({ cell, amount: decodeXudtData(cell.outputData).amount }))
    .filter((c) => c.amount >= amount)
    .sort((a, b) => (a.amount < b.amount ? -1 : a.amount > b.amount ? 1 : 0));

  line("transfer");
  console.log(`holder:       ${holder.address}`);
  console.log(`holder hash:  ${holder.lockHash}`);
  console.log(`third party:  ${owner.address}`);
  console.log(`amount:       ${amount} units`);
  console.log(`cap:          ${CAP} units`);
  console.log(`expect:       ${expectReject ? "REJECT" : "PASS"}`);
  console.log(`live cells:   ${cells.length}`);
  for (const c of cells) {
    console.log(
      `  ${c.outPoint.txHash}:${c.outPoint.index}  ${decodeXudtData(c.outputData).amount} units  ${ccc.fixedPointToString(c.cellOutput.capacity)} CKB`,
    );
  }
  if (candidates.length === 0) {
    throw new Error(`no live cell holds at least ${amount} units`);
  }

  const chosen = candidates[0];
  const remaining = chosen.amount - amount;
  console.log(`\nselected:     ${chosen.cell.outPoint.txHash}:${chosen.cell.outPoint.index} (${chosen.amount} units)`);
  console.log(`remaining:    ${remaining} units`);

  const known = await getKnownXudt(client);
  const extensionDep = ccc.CellDep.from({
    outPoint: state.extension.outPoint,
    depType: "code",
  });

  const tx = ccc.Transaction.from({
    inputs: [{ previousOutput: chosen.cell.outPoint }],
    outputs: [
      {
        lock: owner.lock,
        type,
        capacity: ckbToShannons(TOKEN_OUTPUT_CAPACITY),
      },
      {
        lock: holder.lock,
        type,
        capacity: ckbToShannons(TOKEN_OUTPUT_CAPACITY),
      },
    ],
    outputsData: [u128LE(amount), u128LE(remaining)],
    cellDeps: [...known.cellDeps.map((c) => c.cellDep), extensionDep],
  });

  line("balancing");
  await tx.completeInputsByCapacity(holder.signer);
  await tx.completeFeeBy(holder.signer, 1500n);
  console.log(`inputs:  ${tx.inputs.length}`);
  console.log(`outputs: ${tx.outputs.length}`);
  console.log(`fee:     ${ccc.fixedPointToString(await tx.getFee(client))} CKB`);
  console.log(`first input is the xUDT cell: ${tx.inputs[0].previousOutput.txHash === chosen.cell.outPoint.txHash}`);
  console.log("owner input present: false (holder pays the fee)");

  if (process.env.DRY_RUN === "1") {
    console.log("\nDRY_RUN=1: transaction built and balanced, not broadcast");
    return;
  }

  line("broadcast");
  let txHash;
  try {
    txHash = await holder.signer.sendTransaction(tx);
  } catch (e) {
    if (!expectReject) {
      throw e;
    }
    console.log("rejected as expected");
    console.log(String(e.message).slice(0, 1200));
    console.log("\nRESULT: FAIL (cap enforced)");
    return;
  }

  if (expectReject) {
    console.log(`unexpectedly accepted: ${txHash}`);
    throw new Error("expected rejection but the transaction was accepted");
  }

  console.log(`tx:        ${txHash}`);
  console.log(`explorer:  ${explorerTx(txHash)}`);

  line("wait for commit");
  const committed = await waitCommitted(txHash);
  console.log(`\nstatus:    ${committed.status}`);
  console.log(`block:     ${committed.blockNumber}`);

  const sentCell = await client.getCellLive({ txHash, index: 0 }, true);
  const changeCell = await client.getCellLive({ txHash, index: 1 }, true);
  if (!sentCell || !changeCell) {
    throw new Error("transfer outputs are not live");
  }
  const sent = decodeXudtData(sentCell.outputData).amount;
  const change = decodeXudtData(changeCell.outputData).amount;
  console.log(`output 0:  ${sent} units -> ${await sentCell.cellOutput.lock.hash()}`);
  console.log(`output 1:  ${change} units -> ${await changeCell.cellOutput.lock.hash()}`);
  if (sent !== amount || change !== remaining) {
    throw new Error("output amounts mismatch");
  }

  state.transfers = state.transfers || [];
  state.transfers.push({
    txHash,
    blockNumber: committed.blockNumber,
    from: holder.address,
    to: owner.address,
    amount: amount.toString(),
    change: remaining.toString(),
  });
  saveState(state);

  console.log("\nRESULT: PASS");
  console.log(JSON.stringify(state.transfers.at(-1), null, 2));
}

main().catch((e) => {
  console.error("\nExecution error:", e);
  process.exit(1);
});
