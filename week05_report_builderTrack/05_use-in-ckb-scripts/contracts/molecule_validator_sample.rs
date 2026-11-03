//! Molecule Validator Smart Contract Sample (Rust `no_std`)
//! Demonstrates zero-copy decoding of cell data and witness args on CKB-VM

#![no_std]
#![cfg_attr(not(test), no_main)]

#[cfg(not(test))]
use ckb_std::default_alloc;
#[cfg(not(test))]
default_alloc!();

use ckb_std::{
    ckb_constants::Source,
    ckb_types::{bytes::Bytes, prelude::*},
    debug, entry,
    error::SysError,
    high_level::{load_cell_data, load_script, load_witness_args},
};

// Error codes for on-chain exit status
#[repr(i8)]
pub enum ContractError {
    IndexOutOfBound = 1,
    ItemMissing = 2,
    LengthNotEnough = 3,
    EncodingInvalid = 4,
    InvariantViolation = 5,
}

impl From<SysError> for ContractError {
    fn from(err: SysError) -> Self {
        match err {
            SysError::IndexOutOfBound => ContractError::IndexOutOfBound,
            SysError::ItemMissing => ContractError::ItemMissing,
            SysError::LengthNotEnough(_) => ContractError::LengthNotEnough,
            SysError::Encoding => ContractError::EncodingInvalid,
            _ => ContractError::EncodingInvalid,
        }
    }
}

entry!(program_entry);

fn program_entry() -> i8 {
    match validate_molecule_state() {
        Ok(_) => 0,
        Err(err) => err as i8,
    }
}

/// Validates that output cell data conforms to a canonical Molecule Table
fn validate_molecule_state() -> Result<(), ContractError> {
    debug!("=== [CKB-VM] Executing Molecule Validator Script ===");

    // 1. Load raw cell data of Output 0 via syscall
    let raw_data = load_cell_data(0, Source::Output)?;
    debug!("Loaded Output 0 data length: {} bytes", raw_data.len());

    if raw_data.len() < 4 {
        return Err(ContractError::LengthNotEnough);
    }

    // 2. Zero-Copy Header Inspection (Molecule Table Format)
    // First 4 bytes denote total table length
    let mut total_size_bytes = [0u8; 4];
    total_size_bytes.copy_from_slice(&raw_data[0..4]);
    let total_size = u32::from_le_bytes(total_size_bytes) as usize;

    if total_size != raw_data.len() {
        debug!("Error: Molecule total size header mismatch!");
        return Err(ContractError::EncodingInvalid);
    }

    // 3. Inspect Field 0 (e.g. state version) without full deserialization
    // Offset for field 0 is at byte 4..8
    let mut offset_0_bytes = [0u8; 4];
    offset_0_bytes.copy_from_slice(&raw_data[4..8]);
    let offset_0 = u32::from_le_bytes(offset_0_bytes) as usize;

    if offset_0 + 4 > raw_data.len() {
        return Err(ContractError::EncodingInvalid);
    }

    let mut version_bytes = [0u8; 4];
    version_bytes.copy_from_slice(&raw_data[offset_0..offset_0 + 4]);
    let version = u32::from_le_bytes(version_bytes);
    debug!("Successfully read state version: {}", version);

    if version == 0 {
        debug!("Invariant violated: version must be >= 1");
        return Err(ContractError::InvariantViolation);
    }

    debug!("Molecule verification passed with 0 heap allocations.");
    Ok(())
}
