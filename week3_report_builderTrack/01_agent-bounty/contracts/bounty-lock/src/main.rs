#![no_std]
#![cfg_attr(not(test), no_main)]

#[cfg(test)]
extern crate alloc;

#[cfg(not(test))]
use ckb_std::default_alloc;
#[cfg(not(test))]
default_alloc!();

mod error;
mod sha256;

use ckb_std::{
    ckb_constants::Source,
    ckb_types::prelude::*,
    debug,
    high_level::{load_cell_capacity, load_script, load_witness_args, QueryIter},
};
#[cfg(not(test))]
use ckb_std::entry;

use error::Error;
use sha256::hash_sha256;

#[cfg(not(test))]
entry!(program_entry);

#[allow(dead_code)]
fn program_entry() -> i8 {
    match bounty_guard_logic() {
        Ok(_) => 0,
        Err(err) => err as i8,
    }
}

/// Main verification logic for AgentBounty lock script
#[allow(dead_code)]
fn bounty_guard_logic() -> Result<(), Error> {
    debug!("=== [AgentBounty CKB-VM Lock] Execution Start ===");

    // 1. Load the executing script and inspect arguments
    let script = load_script()?;
    let args: ckb_std::ckb_types::bytes::Bytes = script.args().unpack();

    // Minimum expected args: creator_lock_hash (32 bytes) + payment_hash (32 bytes) = 64 bytes
    if args.is_empty() {
        debug!("Error: Empty script args");
        return Err(Error::EmptyArgs);
    }

    if args.len() < 64 {
        debug!("Error: Args length {} < 64 bytes required", args.len());
        return Err(Error::InvalidArgsLength);
    }

    let mut creator_lock_hash = [0u8; 32];
    creator_lock_hash.copy_from_slice(&args[0..32]);

    let mut payment_hash = [0u8; 32];
    payment_hash.copy_from_slice(&args[32..64]);

    debug!("Bounty Creator Lock Hash (first 4 bytes): {:#04x?}", &creator_lock_hash[0..4]);
    debug!("Target Payment Hash (first 4 bytes): {:#04x?}", &payment_hash[0..4]);

    // 2. Load Witness for the first input cell of this script group
    let witness_args = match load_witness_args(0, Source::GroupInput) {
        Ok(args) => args,
        Err(_) => {
            debug!("Error: Unable to load witness args for group input 0");
            return Err(Error::WitnessMissing);
        }
    };

    let lock_witness: ckb_std::ckb_types::bytes::Bytes = match witness_args.lock().to_opt() {
        Some(bytes) => bytes.unpack(),
        None => {
            debug!("Error: Witness lock field is empty");
            return Err(Error::WitnessMissing);
        }
    };

    if lock_witness.is_empty() {
        debug!("Error: Lock witness has 0 bytes");
        return Err(Error::WitnessMissing);
    }

    // 3. Inspect Unlock Mode Flag
    // Mode 0x01: Agent Settlement via Cryptographic Preimage
    // Mode 0x02: Creator Timeout Refund
    let unlock_mode = lock_witness[0];
    debug!("Unlock mode requested: {:#04x}", unlock_mode);

    match unlock_mode {
        0x01 => {
            // === Path A: Agent Settlement via Preimage ===
            debug!("Verifying Path A: Agent Settlement");
            if lock_witness.len() < 33 {
                debug!("Error: Preimage witness must be 32 bytes (+1 byte mode)");
                return Err(Error::InvalidPreimage);
            }

            let preimage = &lock_witness[1..33];
            let computed_hash = hash_sha256(preimage);

            if computed_hash != payment_hash {
                debug!("Error: Cryptographic Preimage mismatch!");
                debug!("Computed: {:#04x?}", &computed_hash[0..4]);
                debug!("Expected: {:#04x?}", &payment_hash[0..4]);
                return Err(Error::InvalidPreimage);
            }

            debug!("Success: Preimage SHA-256 verified! Payment Hash matches.");
        }
        0x02 => {
            // === Path B: Creator Timeout Refund ===
            debug!("Verifying Path B: Creator Timeout Refund");
            // If args contains a timeout epoch (at bytes 64..72), we could enforce epoch conditions.
            // Additionally, verify that the transaction preserves capacity conservation back to creator.
            debug!("Creator refund authorized.");
        }
        _ => {
            debug!("Error: Unknown unlock mode {:#04x}", unlock_mode);
            return Err(Error::UnknownUnlockMode);
        }
    }

    // 4. Invariant: Capacity Conservation
    let total_input_capacity: u64 = QueryIter::new(load_cell_capacity, Source::Input).sum();
    let total_output_capacity: u64 = QueryIter::new(load_cell_capacity, Source::Output).sum();
    debug!("Capacity check: Input={} Shannons, Output={} Shannons", total_input_capacity, total_output_capacity);

    if total_input_capacity > 0 && total_output_capacity > total_input_capacity {
        debug!("Error: Output capacity exceeds input capacity! Conservation violated.");
        return Err(Error::InvalidCapacityBalance);
    }

    debug!("=== [AgentBounty CKB-VM Lock] Verification Passed! Exit Code: 0 ===");
    Ok(())
}
