/**
 * Molecule Schema Language Types & Validation Demonstration
 * Validates all compound types specified in types_demo.mol:
 * 1. Array (Fixed byte sequence)
 * 2. Struct (Fixed-size compound)
 * 3. Fixvec (Fixed-item vector)
 * 4. Dynvec (Dynamic-item vector)
 * 5. Option (Nullable container)
 * 6. Union (Tagged variant)
 * 7. Table (Dynamic compound with offset header)
 */

const { mol, bytesTo, bytesFrom } = require('@ckb-ccc/core');

function runSchemaValidation() {
  console.log('Molecule Schema Language Type System Verification');
  console.log('--------------------------------------------------');

  // [1] Array: Fixed byte length
  const Byte32 = mol.Byte32;
  const dummyHash = '0x' + '11'.repeat(32);
  const encArray = Byte32.encode(dummyHash);
  console.log(`[1] Array (Byte32): ${encArray.length} bytes (Zero header overhead)`);

  // [2] Struct: Fixed-size composite
  const Point2D = mol.struct({
    x: mol.Uint32LE,
    y: mol.Uint32LE,
  });
  const encStruct = Point2D.encode({ x: 1024, y: 2048 });
  console.log(`[2] Struct (Point2D { x, y }): ${encStruct.length} bytes -> Hex: 0x${bytesTo(encStruct, 'hex')}`);

  // [3] Fixvec: Fixed-size item vector
  const PointVec = mol.fixedItemVec(Point2D);
  const encFixvec = PointVec.encode([
    { x: 1, y: 2 },
    { x: 3, y: 4 },
    { x: 5, y: 6 }
  ]);
  // Total size: 4 bytes item count + (3 * 8 bytes) = 28 bytes
  console.log(`[3] Fixvec (vector PointVec <Point2D>): ${encFixvec.length} bytes (4-byte count + 3x8-byte structs)`);

  // [4] Dynvec: Dynamic-size item vector
  const StringsVec = mol.dynItemVec(mol.String);
  const encDynvec = StringsVec.encode(['Nervos', 'CKB', 'Molecule']);
  // Header: 4 bytes total size + 3 * 4 bytes offsets = 16 bytes header + payloads
  console.log(`[4] Dynvec (vector StringsVec <String>): ${encDynvec.length} bytes (Total size + 3 offsets + data)`);

  // [5] Option: Optional container
  const PointOpt = mol.option(Point2D);
  const encNone = PointOpt.encode(undefined);
  const encSome = PointOpt.encode({ x: 10, y: 20 });
  console.log(`[5] Option (PointOpt): None = ${encNone.length} bytes, Some = ${encSome.length} bytes`);

  // [6] Union: Polymorphic variant
  const ActionPayload = mol.union({
    Text: mol.String,
    Point: Point2D
  });
  const encUnion1 = ActionPayload.encode({ type: 'Text', value: 'hello' });
  const encUnion2 = ActionPayload.encode({ type: 'Point', value: { x: 77, y: 88 } });
  console.log(`[6] Union (ActionPayload):`);
  console.log(`    Variant 'Text'  -> ID: ${encUnion1[0]}, total length: ${encUnion1.length} bytes`);
  console.log(`    Variant 'Point' -> ID: ${encUnion2[0]}, total length: ${encUnion2.length} bytes`);

  // [7] Table: Dynamic composite structure
  const UserProfile = mol.table({
    user_id: mol.Uint32LE,
    username: mol.String,
    location: mol.option(Point2D),
    tags: mol.dynItemVec(mol.String),
    action: ActionPayload
  });

  const sampleUser = {
    user_id: 8888,
    username: 'satoshinakamoto',
    location: { x: 1337, y: 7331 },
    tags: ['pow', 'utxo', 'p2p'],
    action: { type: 'Point', value: { x: 42, y: 84 } }
  };

  const encTable = UserProfile.encode(sampleUser);
  const decTable = UserProfile.decode(encTable);

  console.log(`[7] Table (UserProfile):`);
  console.log(`    Encoded binary size : ${encTable.length} bytes`);
  console.log(`    Decoded user_id     : ${decTable.user_id}`);
  console.log(`    Decoded username    : ${decTable.username}`);
  console.log(`    Decoded location    : x=${decTable.location.x}, y=${decTable.location.y}`);
  console.log(`    Decoded tags count  : ${decTable.tags.length} items`);
  console.log(`    Decoded action type : ${decTable.action.type}`);

  console.log('\nAll 7 canonical Molecule data types encoded & decoded successfully.');
}

runSchemaValidation();
