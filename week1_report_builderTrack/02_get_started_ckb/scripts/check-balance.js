import { ccc } from "@ckb-ccc/core";

const privKey = "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574";
const client = new ccc.ClientPublicTestnet({
  url: "https://testnet.ckb.dev",
});
const signer = new ccc.SignerCkbPrivateKey(client, privKey);

async function checkBalance() {
  try {
    const address = await signer.getRecommendedAddress();
    const balance = await signer.getBalance();
    console.log(`Address: ${address}`);
    console.log(`Balance: ${ccc.fixedPointToString(balance)} CKB`);
  } catch (err) {
    console.error("Error checking balance:", err);
  }
}

checkBalance();
