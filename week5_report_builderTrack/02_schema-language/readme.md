# 📜 02 - Molecule Schema Language & Type System

**Module**: Week 5 - Serialization Track (Lesson 17)  
**Author**: Riko Kurnia Sandi  
**Official Reference**: [Nervos Docs: Molecule Schema Language](https://docs.nervos.org/docs/serialization/schema-language) | [RFC 0008: Schema Grammar](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0008-serialization/0008-serialization.md)

---

## 1. Overview of Molecule Schema Language

Molecule utilizes a declarative Interface Description Language (IDL) with a syntax familiar to Rust and C developers. Schemas are defined in `.mol` text files and compile deterministically into language-specific source code (Rust, C, TypeScript, Go).

The type system is strictly divided into **Fixed-size Types** and **Dynamic-size Types**.

```text
                                 Molecule Type Hierarchy
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
            Fixed-Size Types                                Dynamic-Size Types
            (Compile-time known size)                       (Run-time determined size)
            ├── byte (1 byte)                               ├── Fixvec (Count + elements)
            ├── array [byte; N]                             ├── Dynvec (Total size + offsets)
            └── struct { fixed_fields... }                  ├── table { mixed_fields... }
                                                            ├── option (0 bytes or inner)
                                                            └── union (4-byte ID + variant)
```

---

## 2. Complete Compound Type Specification

### 1. `byte` (Primitive)
The atomic building block representing an 8-bit unsigned integer (`u8`). All higher-level types decompose into bytes.

### 2. `array [Type; N]` (Fixed Array)
A fixed-length contiguous sequence of a fixed-size type.
```rust
array Byte32 [byte; 32];
array Uint32 [byte; 4];
array Uint64 [byte; 8];
```
- **Header Overhead**: `0 bytes`.
- **Total Size**: Exactly $N \times \text{sizeof}(\text{Type})$.

### 3. `struct` (Fixed Composite)
A composite structure consisting **exclusively of fixed-size fields**.
```rust
struct OutPoint {
    tx_hash: Byte32,
    index:   Uint32,
}
```
- **Header Overhead**: `0 bytes`.
- **Constraint**: Cannot contain dynamic vectors, tables, options, or unions.
- **Total Size**: Exact sum of all field sizes. No compiler padding is inserted.

### 4. `vector` (Dynamic Sequences)
Molecule distinguishes between two categories of vectors based on item type:
- **Fixvec** (`vector OutPointVec <OutPoint>;`):
  Used when inner elements have a fixed size.
  Header consists of a single 4-byte little-endian `uint32` denoting the **item count**.
- **Dynvec** (`vector BytesVec <Bytes>;`):
  Used when inner elements have dynamic sizes.
  Header consists of:
  1. 4-byte `uint32` **total byte size**.
  2. $N \times 4$-byte **offset table** pointing to the beginning of each dynamic item.

### 5. `option` (Nullable Container)
Represents an optional value (equivalent to Rust's `Option<T>` or TypeScript's `T | undefined`).
```rust
option ScriptOpt (Script);
```
- When `None`: Serialized length is strictly **0 bytes**.
- When `Some`: Serialized length is equal to the serialized length of the inner type.

### 6. `union` (Polymorphic Tagged Union)
Represents a variant type (equivalent to a Rust `enum` with associated data).
```rust
union ActionPayload {
    Bytes,
    OutPoint,
    Point2D,
}
```
- Header: 4-byte little-endian `uint32` containing the **0-indexed variant ID**.
- Body: Contiguous serialized payload of the selected variant.

### 7. `table` (Dynamic Composite)
The most versatile Molecule compound type, capable of holding any combination of fixed, dynamic, optional, or union fields.
```rust
table CellOutput {
    capacity: Uint64,
    lock:     Script,
    type_:    ScriptOpt,
}
```
- Header:
  1. 4-byte `uint32` **total byte size**.
  2. $N \times 4$-byte **offset table** pointing to the start of each field.
- **Forward & Backward Compatibility**: If a schema adds new fields to a table in later versions, existing contracts safely read their known fields via the offset table without parsing errors.

---

## 3. Real-World Schemas in this Module

1. [`schemas/types_demo.mol`](./schemas/types_demo.mol): Complete reference schema covering all 7 types (`Byte32`, `Point2D`, `OutPoint`, `PointVec`, `BytesVec`, `PointOpt`, `ActionPayload`, `UserProfile`).
2. [`schemas/blockchain.mol`](./schemas/blockchain.mol): Authentic subset of Nervos CKB's core protocol schema (`Transaction`, `RawTransaction`, `CellInput`, `CellOutput`, `Script`).

---

## 4. Execution & Validation Results

We executed the complete type system test in [`scripts/schema_validation_demo.js`](./scripts/schema_validation_demo.js):

![Molecule Schema Language Validation Proof](./images/foto3.png)

```text
Molecule Schema Language Type System Verification
--------------------------------------------------
[1] Array (Byte32): 32 bytes (Zero header overhead)
[2] Struct (Point2D { x, y }): 8 bytes -> Hex: 0x0004000000080000
[3] Fixvec (vector PointVec <Point2D>): 28 bytes (4-byte count + 3x8-byte structs)
[4] Dynvec (vector StringsVec <String>): 45 bytes (Total size + 3 offsets + data)
[5] Option (PointOpt): None = 0 bytes, Some = 8 bytes
[6] Union (ActionPayload):
    Variant 'Text'  -> ID: 0, total length: 13 bytes
    Variant 'Point' -> ID: 1, total length: 12 bytes
[7] Table (UserProfile):
    Encoded binary size : 105 bytes
    Decoded user_id     : 8888
    Decoded username    : satoshinakamoto
    Decoded location    : x=1337, y=7331
    Decoded tags count  : 3 items
    Decoded action type : Point

All 7 canonical Molecule data types encoded & decoded successfully.
```

Next, we inspect the exact byte-level memory layouts in [03_encoding-specs](../03_encoding-specs/readme.md).
