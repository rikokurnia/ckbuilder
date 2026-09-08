use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, Serialize, Deserialize)]
struct JsonRpcResponse<T> {
    jsonrpc: String,
    id: u64,
    result: Option<T>,
    error: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
struct TipHeader {
    number: String,
    hash: String,
    epoch: String,
    timestamp: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct BlockchainInfo {
    chain: String,
    median_time: String,
    epoch: String,
    difficulty: String,
    is_initial_block_download: bool,
}

const CKB_TESTNET_RPC: &str = "https://testnet.ckb.dev/rpc";

async fn rpc_call<T: for<'de> Deserialize<'de>>(
    client: &reqwest::Client,
    method: &str,
    params: serde_json::Value,
) -> Result<T, Box<dyn std::error::Error>> {
    let body = json!({
        "id": 1,
        "jsonrpc": "2.0",
        "method": method,
        "params": params,
    });

    let resp = client
        .post(CKB_TESTNET_RPC)
        .json(&body)
        .send()
        .await?
        .json::<JsonRpcResponse<T>>()
        .await?;

    if let Some(err) = resp.error {
        return Err(format!("RPC error in {}: {:?}", method, err).into());
    }

    resp.result
        .ok_or_else(|| format!("Empty result returned for RPC method: {}", method).into())
}

fn parse_hex_u64(hex_str: &str) -> u64 {
    let trimmed = hex_str.trim_start_matches("0x");
    u64::from_str_radix(trimmed, 16).unwrap_or(0)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("╔═══════════════════════════════════════════════════════════════════════════╗");
    println!("║       🦀 Nervos CKB Rust Off-Chain RPC Client (Week 2 - 01 Rust Basic)     ║");
    println!("╚═══════════════════════════════════════════════════════════════════════════╝");
    println!("🔗 RPC Endpoint: {}", CKB_TESTNET_RPC);
    println!();

    let client = reqwest::Client::new();

    // 1. Query Blockchain Info
    println!("📡 [1/3] Querying Blockchain Information...");
    let info: BlockchainInfo = rpc_call(&client, "get_blockchain_info", json!([])).await?;
    println!("   • Chain Name      : {}", info.chain);
    println!("   • Difficulty      : {}", info.difficulty);
    println!("   • Initial Syncing : {}", info.is_initial_block_download);
    println!();

    // 2. Query Tip Header
    println!("📦 [2/3] Querying Tip Header (Latest Block)...");
    let tip: TipHeader = rpc_call(&client, "get_tip_header", json!([])).await?;
    let block_num = parse_hex_u64(&tip.number);
    let timestamp_ms = parse_hex_u64(&tip.timestamp);

    println!("   • Block Number    : #{} ({})", block_num, tip.number);
    println!("   • Block Hash      : {}", tip.hash);
    println!("   • Epoch Info      : {}", tip.epoch);
    println!("   • Timestamp (ms)  : {} ms", timestamp_ms);
    println!();

    // 3. Query General Epoch & Consensus
    println!("⚙️  [3/3] Querying Consensus & Epoch Information...");
    let epoch_data: serde_json::Value = rpc_call(&client, "get_current_epoch", json!([])).await?;
    if let Some(epoch_num) = epoch_data.get("number").and_then(|v| v.as_str()) {
        println!("   • Current Epoch   : #{}", parse_hex_u64(epoch_num));
    }
    if let Some(start_num) = epoch_data.get("start_number").and_then(|v| v.as_str()) {
        println!("   • Epoch Start Blk : #{}", parse_hex_u64(start_num));
    }
    if let Some(len) = epoch_data.get("length").and_then(|v| v.as_str()) {
        println!("   • Epoch Length    : {} blocks", parse_hex_u64(len));
    }

    println!();
    println!("✅ All CKB Testnet RPC queries executed successfully via Rust!");
    Ok(())
}
