# 🎮 06 - Role-Playing Game (RPG) Molecule On-Chain Implementation

**Module**: Week 5 - Serialization Track (Lesson 17)  
**Author**: Riko Kurnia Sandi  
**Official Reference**: [Nervos Docs: Example: A Role-Playing Game](https://docs.nervos.org/docs/serialization/example-role-playing-game)

---

## 1. System Architecture & RPG Domain Model

To validate Molecule serialization in a real-world complex scenario, we implemented the canonical **Role-Playing Game (RPG)** data schema specified by Nervos. 

Games and decentralized state machines require rich data structures containing nested structs, dynamic lists of inventory items, polymorphic stats, and variable-length text. Molecule serializes this entire hierarchy into a deterministic, compact byte array stored directly inside a CKB Cell's `cell_data`.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        PlayerCharacter (Table)                         │
├───────────────┬───────────────────────────────┬────────────────────────┤
│ character_id  │ Uint32 (4 bytes)              │ 1001                   │
│ name          │ String (Dynamic length)       │ "Riko the CKB Architect│
│ level         │ Uint16 (2 bytes)              │ 50                     │
│ experience    │ Uint64 (8 bytes)              │ 1,250,000              │
│ attributes    │ Attributes (Struct)           │ STR=450, AGI=380, ...  │
│ inventory     │ Inventory (Vector of Items)   │ 3 Equipped Items       │
│ skills        │ Skills (Vector of Skills)     │ 2 Active Combat Skills │
└───────────────┴───────────────────────────────┴────────────────────────┘
```

---

## 2. Declarative Schema (`schemas/rpg.mol`)

The complete schema is maintained in [`schemas/rpg.mol`](./schemas/rpg.mol):

```rust
array Uint8  [byte; 1];
array Uint16 [byte; 2];
array Uint32 [byte; 4];
array Uint64 [byte; 8];

vector Bytes <byte>;

struct Attributes {
    strength:     Uint16,
    agility:      Uint16,
    intelligence: Uint16,
    vitality:     Uint16,
}

table Item {
    id:          Uint32,
    name:        Bytes,
    rarity:      byte,      // 0 = Common, 1 = Rare, 2 = Epic, 3 = Legendary
    power_bonus: Uint16,
}

vector Inventory <Item>;

table Skill {
    id:          Uint32,
    name:        Bytes,
    mana_cost:   Uint16,
    cooldown_s:  byte,
}

vector Skills <Skill>;

table PlayerCharacter {
    character_id: Uint32,
    name:         Bytes,
    level:        Uint16,
    experience:   Uint64,
    attributes:   Attributes,
    inventory:    Inventory,
    skills:       Skills,
}
```

---

## 3. Live On-Chain Testnet Verification

We executed [`scripts/rpg_onchain_demo.js`](./scripts/rpg_onchain_demo.js) to serialize the character state, broadcast an on-chain transaction to the CKB Testnet (Pudge), wait for block inclusion, and deserialize the state back directly from the confirmed cell.

### Live On-Chain Parameters:
- **Network**: CKB Testnet (Pudge)
- **Signer Address**: `ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwy0rpn3trq0sj2q6arv7xaq9w6m6xa0egxe8xvr`
- **Transaction Hash**: [`0x8f07ac16a7be7438736e9c56d6682b0cc623ffecb1a706e2c00e5456eccc6b02`](https://pudge.explorer.nervos.org/transaction/0x8f07ac16a7be7438736e9c56d6682b0cc623ffecb1a706e2c00e5456eccc6b02)
- **Confirmed in Block**: `#22,583,103`
- **Output Capacity**: `220.0 CKB`

### Execution Proof & Terminal Log:

![RPG Molecule On-Chain Verification Proof](./images/foto-6.png)

```text
Role-Playing Game (RPG) Molecule On-Chain Testnet Verification
-------------------------------------------------------------
Signer address : ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwy0rpn3trq0sj2q6arv7xaq9w6m6xa0egxe8xvr
Current balance: 59766.999409 CKB

Serialized Molecule Character State:
  Payload Byte Length : 352 bytes
  Hex Representation  : 0x6001000020000000240000003e0000004000000048000000... [truncated]

Constructing on-chain transaction with serialized cell data...
Signing and broadcasting transaction to CKB Testnet...
Transaction Hash: 0x8f07ac16a7be7438736e9c56d6682b0cc623ffecb1a706e2c00e5456eccc6b02
Explorer URL    : https://pudge.explorer.nervos.org/transaction/0x8f07ac16a7be7438736e9c56d6682b0cc623ffecb1a706e2c00e5456eccc6b02
Waiting for transaction confirmation on CKB Testnet......
Transaction confirmed in block #22,583,103!

Fetching live cell data from CKB Testnet RPC...
  On-chain data received: 706 bytes

Deserialized On-Chain Character Object:
  Name        : Riko the CKB Architect
  Level       : 50
  Experience  : 1250000
  Attributes  : STR=450, AGI=380, INT=520, VIT=410
  Items Count : 3 items (First: "Nervos Excalibur", Rarity: 3)
  Skills Count: 2 skills (First: "Cell Partition Blast", Mana: 85)

Roundtrip On-Chain Verification: PASSED (100% Exact Match)
On-Chain Block Number: #22583103
```

---

## 4. Key Takeaways

- Complex nested game states (nested structs, inventory vectors, skill sets) can be stored within a single CKB Cell.
- Zero data loss or floating-point truncation occurs across the serialization pipeline.
- The on-chain state is immutable, verifiable, and deterministically queryable by any CKB node or client.
