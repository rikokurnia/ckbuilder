import { ccc } from "@ckb-ccc/core";

// Generate a new 32-byte private key
const privKey = ccc.hexFrom(crypto.getRandomValues(new Uint8Array(32)));
console.log("Private Key:", privKey);

// Create a signer (testnet by default or specify client)
const client = new ccc.ClientPublicTestnet();
const signer = new ccc.SignerCkbPrivateKey(client, privKey);
signer.getRecommendedAddress().then(address => {
    console.log("Testnet Address:", address);
});
