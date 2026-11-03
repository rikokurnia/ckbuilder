import { ccc } from "@ckb-ccc/core";
import {
  CAP,
  EXTENSION_FLAGS,
  ISSUE_AMOUNT,
  SEND_OK,
  SEND_REJECT,
  decodeXudtData,
  encodeExtensionArgs,
  makeClient,
  makeSigner,
  u128LE,
} from "../../scripts/common.mjs";

const EXTENSION = {
  codeHash: "0x" + "ab".repeat(32),
  hashType: "data1",
  args: u128LE(CAP),
};

function modelValidate({ ownerMode, sender, outputs, cap }) {
  if (ownerMode) {
    return { ok: true, code: 0, reason: "owner mode bypass" };
  }
  let sent = 0n;
  for (const out of outputs) {
    if (out.lockHash === sender) continue;
    sent += out.amount;
    if (sent > cap) {
      return {
        ok: false,
        code: -104,
        reason: `non-sender outputs ${sent} > cap ${cap}`,
      };
    }
  }
  return { ok: true, code: 0, reason: `non-sender outputs ${sent} <= cap ${cap}` };
}

function line(title) {
  console.log(`\n== ${title} ==`);
}

async function main() {
  const client = makeClient();
  const { lockHash: owner } = await makeSigner(client);
  const sender = owner;
  const recipient = "0x" + "77".repeat(32);

  line("inputs for this trace");
  console.log(`owner lock hash:     ${owner}`);
  console.log(`recipient lock hash: ${recipient}`);
  console.log(`cap:                 ${CAP} units`);
  console.log(`issue amount:        ${ISSUE_AMOUNT} units`);
  console.log(`extension flags:     ${EXTENSION_FLAGS} (raw ScriptVec)`);

  line("cell data (amount) encoding");
  const data = u128LE(ISSUE_AMOUNT);
  console.log(`data:   ${data}`);
  console.log(`decoded: ${decodeXudtData(data).amount} units`);

  line("type args encoding");
  const args = encodeExtensionArgs({
    ownerLockHash: owner,
    cap: CAP,
    extensionScripts: [EXTENSION],
  });
  const argBytes = Buffer.from(ccc.bytesFrom(args));
  console.log(`args length: ${argBytes.length} bytes`);
  console.log(`args:        ${args.slice(0, 90)}...`);
  console.log(`owner:       ${args.slice(0, 66)}`);
  console.log(`flags:       ${args.slice(66, 74)}`);
  console.log(`ScriptVec:   ${args.slice(74, 106)}...`);
  console.log(`extension:   ${EXTENSION.codeHash} (${EXTENSION.hashType}), args=${EXTENSION.args}`);

  line("extension decision matrix (mirrors transfer_cap.c)");
  const cases = [
    {
      name: "owner mint",
      ownerMode: true,
      outputs: [{ lockHash: sender, amount: ISSUE_AMOUNT }],
    },
    {
      name: "transfer 500 to recipient + 1500 change",
      ownerMode: false,
      outputs: [
        { lockHash: recipient, amount: SEND_OK },
        { lockHash: sender, amount: ISSUE_AMOUNT - SEND_OK },
      ],
    },
    {
      name: "transfer 1000 to recipient (exact cap)",
      ownerMode: false,
      outputs: [
        { lockHash: recipient, amount: CAP },
        { lockHash: sender, amount: ISSUE_AMOUNT - CAP },
      ],
    },
    {
      name: "transfer 1200 to recipient (over cap)",
      ownerMode: false,
      outputs: [
        { lockHash: recipient, amount: SEND_REJECT },
        { lockHash: sender, amount: ISSUE_AMOUNT - SEND_REJECT },
      ],
    },
    {
      name: "split 400 + 900 to two recipients (sum 1300)",
      ownerMode: false,
      outputs: [
        { lockHash: recipient, amount: 400n },
        { lockHash: "0x" + "88".repeat(32), amount: 900n },
        { lockHash: sender, amount: 700n },
      ],
    },
  ];

  console.log(
    "case".padEnd(48) + "result".padEnd(8) + "code".padEnd(7) + "reason",
  );
  for (const c of cases) {
    const r = modelValidate({ ...c, sender, cap: CAP });
    console.log(
      c.name.padEnd(48) +
        (r.ok ? "PASS" : "FAIL").padEnd(8) +
        String(r.code).padEnd(7) +
        r.reason,
    );
  }

  line("owner mode sources checked by xUDT");
  console.log("1. an input cell with the owner lock");
  console.log("2. an output cell whose type script equals the owner lock");
  console.log("3. an input cell whose type script equals the owner lock");
  console.log("4. owner_script + owner_signature in witness args");
  console.log("In this demo the mint transaction satisfies (1), so validate()");
  console.log("receives is_owner_mode=1 and returns 0 before reading args.");

  line("limits of this model");
  console.log("- The first xUDT group input is treated as the sender.");
  console.log("- The cap only covers outputs to locks other than the sender.");
  console.log("- Owner mode is unconditional, so the owner can still move tokens.");
  console.log("- The real decision runs in CKB-VM; this trace documents the rule.");
}

main().catch((e) => {
  console.error("\nExecution error:", e);
  process.exit(1);
});
