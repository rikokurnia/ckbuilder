"use client";

import React, { useState } from "react";
import { Server, MapPin, KeyRound, Box, ArrowLeftRight, Check, Copy } from "lucide-react";
import { ccc } from "@ckb-ccc/connector-react";

interface ConceptCardsProps {
  signer?: ccc.Signer | null;
  address: string;
  tipBlock: string;
}

export function ConceptCards({ signer, address, tipBlock }: ConceptCardsProps) {
  const [activeTab, setActiveTab] = useState<"client" | "address" | "signer" | "cell" | "tx">("cell");
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="cream-card rounded-2xl p-5 md:p-6 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#EBE4D8]">
        <div>
          <h2 className="text-base font-semibold text-[#262320] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
            CCC Core Concepts Explorer
          </h2>
          <p className="text-xs text-[#78716C]">
            Interactive inspection of the 5 foundational pillars in Common Chain Connector
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-[#F5EFE4] border border-[#E7DFD5]">
          <button
            onClick={() => setActiveTab("client")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === "client"
                ? "bg-white text-[#B45309] shadow-sm font-semibold"
                : "text-[#57534E] hover:text-[#262320]"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>1. Client</span>
          </button>

          <button
            onClick={() => setActiveTab("address")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === "address"
                ? "bg-white text-[#B45309] shadow-sm font-semibold"
                : "text-[#57534E] hover:text-[#262320]"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>2. Address</span>
          </button>

          <button
            onClick={() => setActiveTab("signer")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === "signer"
                ? "bg-white text-[#B45309] shadow-sm font-semibold"
                : "text-[#57534E] hover:text-[#262320]"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>3. Signer</span>
          </button>

          <button
            onClick={() => setActiveTab("cell")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === "cell"
                ? "bg-white text-[#B45309] shadow-sm font-semibold"
                : "text-[#57534E] hover:text-[#262320]"
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>4. Cell Model</span>
          </button>

          <button
            onClick={() => setActiveTab("tx")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === "tx"
                ? "bg-white text-[#B45309] shadow-sm font-semibold"
                : "text-[#57534E] hover:text-[#262320]"
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>5. Transaction</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Detailed Concept Architecture */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === "client" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#262320]">
                <Server className="w-4 h-4 text-[#D97706]" />
                <h3>Client Concept (`ccc.ClientPublicTestnet`)</h3>
              </div>
              <p className="text-xs text-[#57534E] leading-relaxed">
                The **Client** interface in CCC connects decentralized applications to the CKB blockchain node JSON-RPC endpoints. It handles querying live cells, fetching transaction statuses, estimating fee rates, and broadcasting transactions.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl cream-card-subtle">
                  <div className="text-[11px] text-[#78716C]">RPC Target Node</div>
                  <div className="text-xs font-semibold text-[#262320] font-mono mt-0.5">https://testnet.ckb.dev/rpc</div>
                </div>
                <div className="p-3 rounded-xl cream-card-subtle">
                  <div className="text-[11px] text-[#78716C]">Chain Network</div>
                  <div className="text-xs font-semibold text-emerald-700 mt-0.5">ckb_testnet (Pudge)</div>
                </div>
                <div className="p-3 rounded-xl cream-card-subtle">
                  <div className="text-[11px] text-[#78716C]">Current Tip Block</div>
                  <div className="text-xs font-semibold text-[#B45309] font-mono mt-0.5">#{tipBlock}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "address" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#262320]">
                <MapPin className="w-4 h-4 text-[#D97706]" />
                <h3>Address Concept (`ccc.Address`)</h3>
              </div>
              <p className="text-xs text-[#57534E] leading-relaxed">
                CKB addresses are human-readable encodings (Bech32m) of a **Lock Script**. The lock script defines the ownership rules for any cell controlled by this address (e.g. SECP256K1 Blake160 public key hash).
              </p>
              <div className="p-3 rounded-xl cream-card-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#78716C]">Active Derived Address:</span>
                  {address && (
                    <button
                      onClick={() => copyToClipboard(address)}
                      className="text-[10px] text-[#B45309] hover:underline flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  )}
                </div>
                <div className="text-xs font-mono text-[#262320] break-all bg-white p-2 rounded-lg border border-[#E7DFD5]">
                  {address || "Connect wallet or enter dev private key to view derived address"}
                </div>
              </div>
            </div>
          )}

          {activeTab === "signer" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#262320]">
                <KeyRound className="w-4 h-4 text-[#D97706]" />
                <h3>Signer Concept (`ccc.Signer`)</h3>
              </div>
              <p className="text-xs text-[#57534E] leading-relaxed">
                A **Signer** in CCC encapsulates cryptographic transaction signing capability across various Web3 authenticators (browser extension wallets, passkeys, or software keys).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl cream-card-subtle">
                  <div className="text-[11px] text-[#78716C]">Active Signer Status</div>
                  <div className="text-xs font-semibold text-[#262320] mt-0.5">
                    {signer ? "Connected & Ready" : "Disconnected"}
                  </div>
                </div>
                <div className="p-3 rounded-xl cream-card-subtle">
                  <div className="text-[11px] text-[#78716C]">Supported Protocols</div>
                  <div className="text-xs font-semibold text-[#B45309] mt-0.5">
                    Omnilock, WebAuthn Passkey, SECP256K1
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "cell" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#262320]">
                <Box className="w-4 h-4 text-[#D97706]" />
                <h3>CKB Cell Model & Capacity Pricing</h3>
              </div>
              <p className="text-xs text-[#57534E] leading-relaxed">
                In CKB, cells are first-class state containers. Holding state on-chain requires locking CKB capacity (1 Byte = 1 CKB). Storing N bytes of data requires:
              </p>
              <div className="p-3.5 rounded-xl bg-[#FEF3C7]/60 border border-[#FDE68A] flex items-center justify-between text-xs">
                <span className="font-semibold text-[#92400E]">Minimum Capacity Formula:</span>
                <span className="font-mono font-bold text-[#B45309]">Capacity ≥ 61 Bytes (Overhead) + N Bytes (Data)</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E7DFD5]">
                  <div className="text-[10px] text-[#78716C]">Capacity (8B)</div>
                  <div className="font-mono font-medium text-[#262320]">8 Bytes</div>
                </div>
                <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E7DFD5]">
                  <div className="text-[10px] text-[#78716C]">CodeHash (32B)</div>
                  <div className="font-mono font-medium text-[#262320]">32 Bytes</div>
                </div>
                <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E7DFD5]">
                  <div className="text-[10px] text-[#78716C]">HashType (1B)</div>
                  <div className="font-mono font-medium text-[#262320]">1 Byte</div>
                </div>
                <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E7DFD5]">
                  <div className="text-[10px] text-[#78716C]">Args (20B)</div>
                  <div className="font-mono font-medium text-[#262320]">20 Bytes</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tx" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#262320]">
                <ArrowLeftRight className="w-4 h-4 text-[#D97706]" />
                <h3>Transaction Assembly (`ccc.Transaction`)</h3>
              </div>
              <p className="text-xs text-[#57534E] leading-relaxed">
                CKB transactions are assembled off-chain. CCC streamlines transaction assembly with two core helper methods:
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg cream-card-subtle font-mono text-[#262320]">
                  <span className="text-[#B45309]">await</span> tx.completeInputsByCapacity(signer);
                  <p className="text-[11px] text-[#78716C] font-sans mt-0.5">
                    Gathers live cells from the signer until outputs capacity is fulfilled.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg cream-card-subtle font-mono text-[#262320]">
                  <span className="text-[#B45309]">await</span> tx.completeFeeBy(signer, 1500n);
                  <p className="text-[11px] text-[#78716C] font-sans mt-0.5">
                    Appends change output cell and satisfies miner transaction fee rate.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Live Code Snippet Box */}
        <div className="cream-card-subtle rounded-xl p-4 border border-[#E5DCD0] space-y-2">
          <div className="text-xs font-semibold text-[#44403C] flex items-center justify-between">
            <span>TypeScript / CCC Reference</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#EAE1D3] text-[#57534E] font-mono">
              @ckb-ccc/core
            </span>
          </div>
          <pre className="p-3 rounded-lg bg-[#24211E] text-[#F5EFE4] text-[11px] font-mono leading-relaxed overflow-x-auto">
{activeTab === "client" && `import { ccc } from "@ckb-ccc/core";

const client = new ccc.ClientPublicTestnet({
  url: "https://testnet.ckb.dev/rpc"
});
const tip = await client.getTipHeader();`}
{activeTab === "address" && `const address = await signer
  .getRecommendedAddress();
const lock = (await signer
  .getRecommendedAddressObj()).script;`}
{activeTab === "signer" && `// Private Key Signer
const signer = new ccc.SignerCkbPrivateKey(
  client,
  "0x1afb1c..."
);`}
{activeTab === "cell" && `// Encode string to UTF-8 Hex
const dataBytes = new TextEncoder()
  .encode("Hello CKB!");
const dataHex = ccc.hexFrom(dataBytes);
// 61B Overhead + Memo Length
const minCKB = 61 + dataBytes.length;`}
{activeTab === "tx" && `const tx = ccc.Transaction.from({
  outputs: [{ lock, capacity: 100n * 10n**8n }],
  outputsData: [dataHex],
});
await tx.completeInputsByCapacity(signer);
await tx.completeFeeBy(signer, 1500n);
const txHash = await signer.sendTransaction(tx);`}
          </pre>
        </div>
      </div>
    </div>
  );
}
