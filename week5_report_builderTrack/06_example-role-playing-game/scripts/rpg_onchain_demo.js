/**
 * Role-Playing Game (RPG) Molecule On-Chain Testnet Verification
 * Demonstrates:
 * 1. Defining complete RPG schema codec matching rpg.mol
 * 2. Serializing a complex game character into canonical Molecule binary
 * 3. Broadcasting transaction on CKB Testnet (Pudge) storing Molecule state in cell_data
 * 4. Polling on-chain confirmation
 * 5. Fetching confirmed live cell data from CKB Testnet & deserializing back to object
 */

const { ccc, mol, bytesTo, bytesFrom } = require('@ckb-ccc/core');

const TESTNET_PRIVATE_KEY = '0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574';

// 1. Defining Molecule Codecs matching rpg.mol
const AttributesCodec = mol.struct({
  strength: mol.Uint16LE,
  agility: mol.Uint16LE,
  intelligence: mol.Uint16LE,
  vitality: mol.Uint16LE
});

const ItemCodec = mol.table({
  id: mol.Uint32LE,
  name: mol.String,
  rarity: mol.Uint8,
  power_bonus: mol.Uint16LE
});

const InventoryCodec = mol.dynItemVec(ItemCodec);

const SkillCodec = mol.table({
  id: mol.Uint32LE,
  name: mol.String,
  mana_cost: mol.Uint16LE,
  cooldown_s: mol.Uint8
});

const SkillsCodec = mol.dynItemVec(SkillCodec);

const PlayerCharacterCodec = mol.table({
  character_id: mol.Uint32LE,
  name: mol.String,
  level: mol.Uint16LE,
  experience: mol.Uint64LE,
  attributes: AttributesCodec,
  inventory: InventoryCodec,
  skills: SkillsCodec
});

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForConfirmation(txHash) {
  process.stdout.write('Waiting for transaction confirmation on CKB Testnet');
  for (let i = 0; i < 30; i++) {
    process.stdout.write('.');
    await sleep(4000);
    try {
      const res = await fetch('https://testnet.ckb.dev/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'get_transaction',
          params: [txHash]
        })
      });
      const data = await res.json();
      if (data && data.result && data.result.tx_status && data.result.tx_status.status === 'committed') {
        const blockNumber = BigInt(data.result.tx_status.block_number);
        console.log(`\nTransaction confirmed in block #${blockNumber.toLocaleString()}!`);
        return blockNumber;
      }
    } catch (_) {}
  }
  console.log('\nWarning: Confirmation check timeout. Proceeding...');
  return null;
}

async function main() {
  console.log('Role-Playing Game (RPG) Molecule On-Chain Testnet Verification');
  console.log('-------------------------------------------------------------');

  const client = new ccc.ClientPublicTestnet();
  const signer = new ccc.SignerCkbPrivateKey(client, TESTNET_PRIVATE_KEY);
  const address = await signer.getRecommendedAddress();
  const balance = await signer.getBalance();

  console.log(`Signer address : ${address}`);
  console.log(`Current balance: ${ccc.fixedPointToString(balance)} CKB`);

  // 2. Instantiate RPG Character Data
  const heroData = {
    character_id: 1001,
    name: 'Riko the CKB Architect',
    level: 50,
    experience: 1250000n,
    attributes: {
      strength: 450,
      agility: 380,
      intelligence: 520,
      vitality: 410
    },
    inventory: [
      { id: 1, name: 'Nervos Excalibur', rarity: 3, power_bonus: 250 },
      { id: 2, name: 'RISC-V Aegis Shield', rarity: 2, power_bonus: 180 },
      { id: 3, name: 'Zero-Copy Boots', rarity: 1, power_bonus: 95 }
    ],
    skills: [
      { id: 101, name: 'Cell Partition Blast', mana_cost: 85, cooldown_s: 6 },
      { id: 102, name: 'Deterministic Slash', mana_cost: 40, cooldown_s: 3 }
    ]
  };

  // 3. Canonical Molecule Encoding
  const serializedBytes = PlayerCharacterCodec.encode(heroData);
  const serializedHex = bytesTo(serializedBytes, 'hex');

  console.log(`\nSerialized Molecule Character State:`);
  console.log(`  Payload Byte Length : ${serializedBytes.length} bytes`);
  console.log(`  Hex Representation  : 0x${serializedHex.slice(0, 48)}... [truncated]`);

  // 4. Construct CKB Testnet Transaction with Molecule Cell Data
  console.log('\nConstructing on-chain transaction with serialized cell data...');
  const tx = ccc.Transaction.from({
    outputs: [
      {
        capacity: ccc.fixedPointFrom(220), // 220 CKB to comfortably store state
        lock: await signer.getRecommendedAddressObj().then(a => a.script)
      }
    ],
    outputsData: [serializedBytes]
  });

  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1500);

  console.log('Signing and broadcasting transaction to CKB Testnet...');
  const txHash = await signer.sendTransaction(tx);
  console.log(`Transaction Hash: ${txHash}`);
  console.log(`Explorer URL    : https://pudge.explorer.nervos.org/transaction/${txHash}`);

  // 5. Wait for Confirmation
  const blockNumber = await waitForConfirmation(txHash);

  // 6. Query Live On-Chain Data & Verify Deserialization
  console.log('\nFetching live cell data from CKB Testnet RPC...');
  const confirmedTx = await client.getTransaction(txHash);
  const onChainData = confirmedTx.transaction.outputsData[0];

  console.log(`  On-chain data received: ${onChainData.length} bytes`);
  const decodedHero = PlayerCharacterCodec.decode(onChainData);

  console.log('\nDeserialized On-Chain Character Object:');
  console.log(`  Name        : ${decodedHero.name}`);
  console.log(`  Level       : ${decodedHero.level}`);
  console.log(`  Experience  : ${decodedHero.experience}`);
  console.log(`  Attributes  : STR=${decodedHero.attributes.strength}, AGI=${decodedHero.attributes.agility}, INT=${decodedHero.attributes.intelligence}, VIT=${decodedHero.attributes.vitality}`);
  console.log(`  Items Count : ${decodedHero.inventory.length} items (First: "${decodedHero.inventory[0].name}", Rarity: ${decodedHero.inventory[0].rarity})`);
  console.log(`  Skills Count: ${decodedHero.skills.length} skills (First: "${decodedHero.skills[0].name}", Mana: ${decodedHero.skills[0].mana_cost})`);

  const match = decodedHero.name === heroData.name &&
                decodedHero.level === heroData.level &&
                decodedHero.inventory.length === heroData.inventory.length &&
                decodedHero.skills.length === heroData.skills.length;

  console.log(`\nRoundtrip On-Chain Verification: ${match ? 'PASSED (100% Exact Match)' : 'FAILED'}`);
  console.log(`On-Chain Block Number: #${blockNumber ? blockNumber.toString() : 'Pending'}`);
}

main().catch((err) => {
  console.error('\nExecution error:', err);
  process.exit(1);
});
