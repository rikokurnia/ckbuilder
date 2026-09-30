/**
 * Molecule Byte-Level Encoding Specifications & Memory Layout Walkthrough
 * Demonstrates exact byte layouts, little-endian length prefixes, and header offset calculations
 */

const { mol, bytesTo } = require('@ckb-ccc/core');

function hexDump(name, bytes) {
  console.log(`\n================================================================`);
  console.log(`TYPE: ${name} (Total Length: ${bytes.length} bytes)`);
  console.log(`Hex: 0x${bytesTo(bytes, 'hex')}`);
  console.log(`----------------------------------------------------------------`);
  console.log(`Offset | Hex Value | Interpretation`);
  console.log(`-------+-----------+--------------------------------------------`);
}

function runEncodingSpecsWalkthrough() {
  console.log('Molecule Byte-Level Encoding Specifications Walkthrough');
  console.log('------------------------------------------------------');

  // [1] Struct Encoding Specification
  // Rules:
  // - Zero header overhead.
  // - Fields are stored strictly sequentially.
  const ColorRGBA = mol.struct({
    r: mol.Uint8,
    g: mol.Uint8,
    b: mol.Uint8,
    a: mol.Uint8
  });
  const colorBytes = ColorRGBA.encode({ r: 255, g: 128, b: 64, a: 255 });
  hexDump('Struct (ColorRGBA { r, g, b, a })', colorBytes);
  console.log(`00..01 | ff        | Field 0 (r): 255`);
  console.log(`01..02 | 80        | Field 1 (g): 128`);
  console.log(`02..03 | 40        | Field 2 (b): 64`);
  console.log(`03..04 | ff        | Field 3 (a): 255`);

  // [2] Fixvec Encoding Specification
  // Rules:
  // - Header: 4-byte uint32 LE item count.
  // - Body: Contiguous sequence of fixed-size items.
  const NumbersVec = mol.fixedItemVec(mol.Uint16LE);
  const numBytes = NumbersVec.encode([0x0102, 0x0304, 0x0506]);
  hexDump('Fixvec (vector NumbersVec <Uint16LE>)', numBytes);
  console.log(`00..04 | 03000000  | Header: Item count = 3 (uint32 LE)`);
  console.log(`04..06 | 0201      | Item 0: 0x0102 (258)`);
  console.log(`06..08 | 0403      | Item 1: 0x0304 (772)`);
  console.log(`08..10 | 0605      | Item 2: 0x0506 (1286)`);

  // [3] Dynvec Encoding Specification
  // Rules:
  // - Header: 4-byte total size + N * 4-byte offsets to each item.
  // - Body: Dynamic item payloads.
  const StringsVec = mol.dynItemVec(mol.String);
  const dynBytes = StringsVec.encode(['ABC', 'WXYZ']);
  hexDump('Dynvec (vector StringsVec <String>)', dynBytes);
  const bufDyn = Buffer.from(dynBytes);
  console.log(`00..04 | ${bytesTo(dynBytes.slice(0, 4), 'hex')}  | Header: Total size = ${bufDyn.readUInt32LE(0)} bytes`);
  console.log(`04..08 | ${bytesTo(dynBytes.slice(4, 8), 'hex')}  | Offset 0 -> Byte ${bufDyn.readUInt32LE(4)} ('ABC')`);
  console.log(`08..12 | ${bytesTo(dynBytes.slice(8, 12), 'hex')}  | Offset 1 -> Byte ${bufDyn.readUInt32LE(8)} ('WXYZ')`);
  console.log(`12..19 | ${bytesTo(dynBytes.slice(12, 19), 'hex')}  | Item 0 Payload (4-byte len=3 + 'ABC')`);
  console.log(`19..27 | ${bytesTo(dynBytes.slice(19, 27), 'hex')}  | Item 1 Payload (4-byte len=4 + 'WXYZ')`);

  // [4] Table Encoding Specification
  // Rules:
  // - Header: 4-byte total size + N * 4-byte offsets to each field.
  // - Body: Field payloads in sequential order.
  const Token = mol.table({
    id: mol.Uint32LE,
    symbol: mol.String,
    decimals: mol.Uint8
  });
  const tokenBytes = Token.encode({
    id: 100,
    symbol: 'CKB',
    decimals: 8
  });
  hexDump('Table (Token { id: Uint32, symbol: String, decimals: Uint8 })', tokenBytes);
  const bufTable = Buffer.from(tokenBytes);
  console.log(`00..04 | ${bytesTo(tokenBytes.slice(0, 4), 'hex')}  | Header: Total size = ${bufTable.readUInt32LE(0)} bytes`);
  console.log(`04..08 | ${bytesTo(tokenBytes.slice(4, 8), 'hex')}  | Offset Field 0 ('id')       -> Byte ${bufTable.readUInt32LE(4)}`);
  console.log(`08..12 | ${bytesTo(tokenBytes.slice(8, 12), 'hex')}  | Offset Field 1 ('symbol')   -> Byte ${bufTable.readUInt32LE(8)}`);
  console.log(`12..16 | ${bytesTo(tokenBytes.slice(12, 16), 'hex')}  | Offset Field 2 ('decimals') -> Byte ${bufTable.readUInt32LE(12)}`);
  console.log(`16..20 | ${bytesTo(tokenBytes.slice(16, 20), 'hex')}  | Field 0 Payload: 100 (uint32 LE)`);
  console.log(`20..27 | ${bytesTo(tokenBytes.slice(20, 27), 'hex')}  | Field 1 Payload: len=3 + 'CKB'`);
  console.log(`27..28 | ${bytesTo(tokenBytes.slice(27, 28), 'hex')}        | Field 2 Payload: 8 (uint8)`);

  // [5] Union Encoding Specification
  // Rules:
  // - Header: 4-byte variant index (uint32 LE).
  // - Body: Selected variant's serialized bytes.
  const Status = mol.union({
    Active: mol.Uint8,
    Suspended: mol.String
  });
  const statusBytes = Status.encode({ type: 'Suspended', value: 'maintenance' });
  hexDump('Union (Status::Suspended("maintenance"))', statusBytes);
  console.log(`00..04 | 01000000  | Header: Variant ID = 1 ('Suspended')`);
  console.log(`04..19 | ${bytesTo(statusBytes.slice(4), 'hex')} | Variant Payload: String len=11 + 'maintenance'`);
}

runEncodingSpecsWalkthrough();
