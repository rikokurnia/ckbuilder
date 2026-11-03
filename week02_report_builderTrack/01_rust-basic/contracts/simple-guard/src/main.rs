#![no_std]
#![cfg_attr(not(test), no_main)]

#[cfg(test)]
extern crate alloc;

#[cfg(not(test))]
use ckb_std::default_alloc;
#[cfg(not(test))]
default_alloc!();

mod error;

use ckb_std::{
    ckb_constants::Source,
    ckb_types::prelude::*,
    debug,
    entry,
    high_level::{load_cell_capacity, load_script, load_tx_hash, QueryIter},
};
use error::Error;

entry!(program_entry);

fn program_entry() -> i8 {
    match guard_logic() {
        Ok(_) => 0,
        Err(err) => err as i8,
    }
}

fn guard_logic() -> Result<(), Error> {
    // Log contract execution start
    debug!("=== [SimpleGuard CKB-VM Contract] Initializing ===");

    // 1. Inspect the executing script and its args
    let script = load_script()?;
    let args: ckb_std::ckb_types::bytes::Bytes = script.args().unpack();
    if args.is_empty() {
        debug!("Script args: empty (unrestricted mode)");
    } else {
        debug!("Script args length: {} bytes", args.len());
    }

    // 2. Load the current transaction hash
    let tx_hash = load_tx_hash()?;
    debug!("Executing inside Tx hash byte 0: {:#04x}", tx_hash[0]);

    // 3. Compute total input capacity
    let total_input_capacity: u64 = QueryIter::new(load_cell_capacity, Source::Input).sum();
    debug!("Total input capacity: {} Shannons", total_input_capacity);

    // 4. Compute total output capacity
    let total_output_capacity: u64 = QueryIter::new(load_cell_capacity, Source::Output).sum();
    debug!("Total output capacity: {} Shannons", total_output_capacity);

    // 5. Invariant check: outputs capacity must not exceed inputs (miner fee constraint)
    if total_input_capacity > 0 && total_output_capacity > total_input_capacity {
        debug!("Error: Output capacity exceeds input capacity! Conservation violated.");
        return Err(Error::InvalidCapacityBalance);
    }

    debug!("=== [SimpleGuard CKB-VM Contract] Verification Passed (Code 0) ===");
    Ok(())
}
