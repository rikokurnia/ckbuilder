import { ccc } from "@ckb-ccc/core";

// ============================================================================
// CCC CORE CONCEPTS SCRIPT: QUERY ALL ON-CHAIN MEMOS
// ============================================================================

const TESTNET_PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574";

async function main() {
  console.log("=================================================================");
  console.log("🔍 CCC CLIENT: QUERYING LIVE ON-CHAIN MEMO CELLS (TESTNET)");
  console.log("=================================================================\n");

  const client = new ccc.ClientPublicTestnet({
    url: "https://testnet.ckb.dev/rpc",
  });

  const signer = new ccc.SignerCkbPrivateKey(client, TESTNET_PRIVATE_KEY);
  const address = await signer.getRecommendedAddress();
  const lockScript = await signer.getRecommendedAddressObj().then((a) => a.script);

  console.log(`📫 Querying Address: ${address}`);
  console.log(`🔒 Lock Script Args: ${lockScript.args}\n`);

  console.log("⏳ Scanning live cells for data payloads...");
  const memos = [];
  let totalCells = 0;

  for await (const cell of client.findCells({ script: lockScript, scriptType: "lock" })) {
    totalCells++;
    // Check if cell has data and has no type script (standard data cell)
    if (cell.outputData && cell.outputData !== "0x" && cell.outputData.length > 2) {
      try {
        const rawBytes = ccc.bytesFrom(cell.outputData);
        // Exclude large binary contracts (> 1KB) or non-text data
        if (rawBytes.length <= 1024) {
          const text = new TextDecoder("utf-8", { fatal: true }).decode(rawBytes);
          // Check if mostly printable ASCII/UTF-8
          if (/^[\x20-\x7E\s\u00A0-\uFFFF]+$/.test(text)) {
            memos.push({
              outPoint: `${cell.outPoint.txHash}:${cell.outPoint.index}`,
              capacity: ccc.fixedPointToString(cell.cellOutput.capacity),
              dataHex: cell.outputData,
              text: text,
              byteLength: rawBytes.length,
            });
          }
        }
      } catch (err) {
        // Not a utf-8 string or binary
      }
    }
  }

  console.log(`\n📊 Scan Completed! Total Live Cells: ${totalCells}`);
  console.log(`📝 Total Memo/Data Cells Found: ${memos.length}\n`);

  if (memos.length === 0) {
    console.log("No data/memo cells found yet for this account.");
  } else {
    memos.forEach((memo, idx) => {
      console.log(`-----------------------------------------------------------------`);
      console.log(`Memo #${idx + 1}`);
      console.log(`📍 OutPoint:  ${memo.outPoint}`);
      console.log(`💰 Capacity:  ${memo.capacity} CKB`);
      console.log(`📏 Data Size: ${memo.byteLength} bytes`);
      console.log(`💬 Message:   "${memo.text}"`);
    });
    console.log(`-----------------------------------------------------------------\n`);
  }
}

main().catch((err) => {
  console.error("❌ Error querying memos:", err);
  process.exit(1);
});
