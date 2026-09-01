"use client";

import React, { useState } from "react";
import { ccc, useCcc, useSigner } from "@ckb-ccc/connector-react";
import { Send, CheckCircle2, AlertCircle, Loader2, Sparkles, ExternalLink, HardDrive } from "lucide-react";

interface PostMemoCardProps {
  customSigner: ccc.Signer | null;
  onMemoPosted: () => void;
}

export function PostMemoCard({ customSigner, onMemoPosted }: PostMemoCardProps) {
  const { client } = useCcc();
  const cccSigner = useSigner();
  const [memoText, setMemoText] = useState("");
  const [capacityCkb, setCapacityCkb] = useState("100");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  const activeSigner = customSigner || cccSigner;

  const memoBytes = new TextEncoder().encode(memoText);
  const memoHex = memoText ? ccc.hexFrom(memoBytes) : "0x";
  const minRequiredCapacity = 61 + memoBytes.length;

  const handlePostMemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSigner) {
      setError("Please connect a wallet or activate a Dev Private Key first.");
      return;
    }

    if (!memoText.trim()) {
      setError("Please enter a memo text to post.");
      return;
    }

    const numCapacity = parseFloat(capacityCkb);
    if (isNaN(numCapacity) || numCapacity < minRequiredCapacity) {
      setError(`Capacity must be at least ${minRequiredCapacity} CKB to store this memo.`);
      return;
    }

    setError("");
    setTxHash("");
    setLoading(true);
    setStatusMessage("Assembling CKB transaction and gathering live input cells...");

    try {
      const lock = (await activeSigner.getRecommendedAddressObj()).script;
      const allocatedCapacity = ccc.fixedPointFrom(numCapacity);

      const tx = ccc.Transaction.from({
        outputs: [
          {
            lock,
            capacity: allocatedCapacity,
          },
        ],
        outputsData: [memoHex],
      });

      setStatusMessage("Balancing inputs, change cell, and miner fee...");
      await tx.completeInputsByCapacity(activeSigner);
      await tx.completeFeeBy(activeSigner, 1500n);

      setStatusMessage("Signing transaction with CCC Signer...");
      const hash = await activeSigner.sendTransaction(tx);
      setTxHash(hash);
      setStatusMessage("Transaction broadcasted! Polling for on-chain block confirmation...");

      // Poll for confirmation
      let confirmed = false;
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        try {
          const res = await fetch("https://testnet.ckb.dev/rpc", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: 1,
              jsonrpc: "2.0",
              method: "get_transaction",
              params: [hash],
            }),
          });
          const json = await res.json();
          if (json?.result?.tx_status?.status === "committed") {
            const blk = parseInt(json.result.tx_status.block_number, 16);
            setStatusMessage(`Committed on-chain in Block #${blk}!`);
            confirmed = true;
            break;
          }
        } catch (err) {
          // Ignore poll err
        }
      }

      if (!confirmed) {
        setStatusMessage("Transaction submitted to mempool (pending confirmation).");
      }

      setMemoText("");
      onMemoPosted();
    } catch (err) {
      console.error("Error posting memo:", err);
      setError((err as Error).message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cream-card rounded-2xl p-6 shadow-sm border border-[#EBE4D8] space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#FEF3C7] text-[#B45309]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-[#262320]">
              Post On-Chain Memo
            </h3>
            <p className="text-xs text-[#78716C]">
              Write immutable state directly into CKB cell data storage
            </p>
          </div>
        </div>

        <div className="px-3 py-1 rounded-full text-xs font-mono bg-[#FAF7F2] border border-[#E7DFD5] text-[#57534E]">
          Min: <span className="font-semibold text-[#B45309]">{minRequiredCapacity} CKB</span>
        </div>
      </div>

      <form onSubmit={handlePostMemo} className="space-y-4">
        {/* Memo Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-medium text-[#44403C]">Memo Message:</label>
            <span className="text-[#A8A29E] font-mono">
              {memoText.length} chars • {memoBytes.length} bytes
            </span>
          </div>
          <textarea
            rows={3}
            value={memoText}
            onChange={(e) => setMemoText(e.target.value)}
            placeholder="Type your permanent on-chain message here..."
            className="w-full cream-input rounded-xl p-3.5 text-xs font-sans resize-none"
            disabled={loading}
          />
        </div>

        {/* Capacity Input & Calculation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#44403C]">
              Allocated Cell Capacity (CKB):
            </label>
            <input
              type="number"
              min={minRequiredCapacity}
              step="1"
              value={capacityCkb}
              onChange={(e) => setCapacityCkb(e.target.value)}
              className="w-full cream-input rounded-xl px-3.5 py-2.5 text-xs font-mono"
              disabled={loading}
            />
            <p className="text-[11px] text-[#A8A29E]">
              61B base overhead + {memoBytes.length}B payload
            </p>
          </div>

          <div className="p-3 rounded-xl cream-card-subtle flex flex-col justify-between text-xs space-y-1">
            <span className="text-[#78716C] flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-[#B45309]" />
              State Storage Breakdown
            </span>
            <div className="font-mono text-[11px] text-[#262320]">
              Overhead: <span className="text-[#B45309]">61 CKB</span> | Data:{" "}
              <span className="text-[#B45309]">{memoBytes.length} CKB</span>
            </div>
            <div className="w-full bg-[#E7DFD5] h-1.5 rounded-full overflow-hidden flex">
              <div
                className="bg-[#D97706] h-full"
                style={{ width: `${Math.min(100, (61 / (minRequiredCapacity || 1)) * 100)}%` }}
              />
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${Math.min(100, (memoBytes.length / (minRequiredCapacity || 1)) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Hex Preview */}
        {memoText && (
          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E7DFD5] space-y-1">
            <div className="text-[11px] font-medium text-[#78716C]">
              Serialized OutputsData Preview:
            </div>
            <div className="text-[11px] font-mono text-[#57534E] break-all">
              {memoHex}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Status Tracker */}
        {statusMessage && (
          <div className="p-3 rounded-xl bg-[#FEF3C7]/80 border border-[#FDE68A] text-[#92400E] text-xs flex items-center gap-2">
            {loading ? (
              <Loader2 className="w-4 h-4 shrink-0 animate-spin text-[#B45309]" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span className="font-medium">{statusMessage}</span>
          </div>
        )}

        {/* Tx Explorer Link */}
        {txHash && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-semibold text-emerald-800">Tx Broadcasted:</span>
              <div className="font-mono text-[11px] text-emerald-700 break-all">
                {txHash}
              </div>
            </div>
            <a
              href={`https://pudge.explorer.nervos.org/transaction/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 shrink-0 ml-2"
              title="Open in CKB Explorer"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !activeSigner}
          className={`w-full py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            loading || !activeSigner
              ? "bg-[#E5DCD0] text-[#A8A29E] cursor-not-allowed"
              : "cream-btn-primary"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Broadcasting to CKB Testnet...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Broadcast Memo Cell On-Chain</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
