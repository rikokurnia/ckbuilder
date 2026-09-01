"use client";

import React, { useEffect, useState } from "react";
import { ccc, useCcc, useSigner } from "@ckb-ccc/connector-react";
import { MessageSquare, ExternalLink, Database, Loader2 } from "lucide-react";

interface MemoItem {
  outPoint: string;
  txHash: string;
  index: number;
  capacity: string;
  dataHex: string;
  text: string;
  byteLength: number;
}

interface MemoFeedProps {
  refreshKey: number;
}

export function MemoFeed({ refreshKey }: MemoFeedProps) {
  const { client, open } = useCcc();
  const signer = useSigner();
  const [memos, setMemos] = useState<MemoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalScanned, setTotalScanned] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchMemos() {
      if (!signer) {
        setMemos([]);
        setTotalScanned(0);
        return;
      }

      setLoading(true);
      try {
        const lock = (await signer.getRecommendedAddressObj()).script;
        const list: MemoItem[] = [];
        let count = 0;

        for await (const cell of client.findCells({ script: lock, scriptType: "lock", scriptSearchMode: "exact" })) {
          count++;
          if (cell.outputData && cell.outputData !== "0x" && cell.outputData.length > 2) {
            try {
              const rawBytes = ccc.bytesFrom(cell.outputData);
              if (rawBytes.length <= 1024) {
                const text = new TextDecoder("utf-8", { fatal: true }).decode(rawBytes);
                if (/^[\x20-\x7E\s\u00A0-\uFFFF]+$/.test(text)) {
                  list.push({
                    outPoint: `${cell.outPoint.txHash}:${cell.outPoint.index.toString()}`,
                    txHash: cell.outPoint.txHash,
                    index: Number(cell.outPoint.index),
                    capacity: ccc.fixedPointToString(cell.cellOutput.capacity),
                    dataHex: cell.outputData,
                    text,
                    byteLength: rawBytes.length,
                  });
                }
              }
            } catch {
              // Binary / non-utf8 data
            }
          }
        }

        if (isMounted) {
          setMemos(list.reverse()); // Show newest first
          setTotalScanned(count);
        }
      } catch (err) {
        console.error("Error querying memos:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchMemos();
    return () => {
      isMounted = false;
    };
  }, [signer, client, refreshKey]);

  return (
    <div className="cream-card rounded-2xl p-6 shadow-sm border border-[#EBE4D8] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#FEF3C7] text-[#B45309]">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-[#262320]">
              On-Chain Memos Feed
            </h3>
            <p className="text-xs text-[#78716C]">
              Decoded state from live CKB Testnet cells owned by your connected wallet
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-[#B45309]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Scanning cells...</span>
            </div>
          )}
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#FAF7F2] border border-[#E7DFD5] text-[#57534E]">
            {memos.length} Memos • {totalScanned} Live Cells
          </span>
        </div>
      </div>

      {/* Feed List */}
      {!signer ? (
        <div className="text-center py-10 px-4 rounded-xl cream-card-subtle space-y-3 border border-dashed border-[#E5DCD0]">
          <Database className="w-8 h-8 text-[#A8A29E] mx-auto" />
          <p className="text-xs text-[#57534E] font-medium">
            Connect your wallet to view your on-chain memo cells.
          </p>
          <button
            onClick={() => open()}
            className="px-4 py-2 rounded-xl text-xs font-semibold cream-btn-primary cursor-pointer inline-block"
          >
            Connect Wallet
          </button>
        </div>
      ) : loading && memos.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-xl cream-card-subtle space-y-2 border border-[#E5DCD0]">
          <Loader2 className="w-8 h-8 text-[#B45309] animate-spin mx-auto" />
          <p className="text-xs text-[#57534E]">Querying live cells on CKB Testnet node...</p>
        </div>
      ) : memos.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-xl cream-card-subtle space-y-2 border border-dashed border-[#E5DCD0]">
          <MessageSquare className="w-8 h-8 text-[#A8A29E] mx-auto" />
          <p className="text-xs font-medium text-[#57534E]">No memos found yet.</p>
          <p className="text-[11px] text-[#78716C]">
            Use the form to broadcast your first message directly on CKB Testnet!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {memos.map((memo, idx) => (
            <div
              key={memo.outPoint || idx}
              className="cream-card-subtle rounded-xl p-4 border border-[#E5DCD0] space-y-3 transition-all hover:border-[#D97706]/40 hover:shadow-sm"
            >
              {/* Message Header */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#FEF3C7] text-[#B45309] font-bold text-[11px] flex items-center justify-center">
                    #{memos.length - idx}
                  </span>
                  <span className="font-mono text-[11px] text-[#78716C]">
                    Cell OutPoint: {memo.outPoint.slice(0, 10)}...{memo.outPoint.slice(-6)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E7DFD5] text-[11px] font-mono text-[#262320]">
                    {memo.capacity} CKB
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E7DFD5] text-[11px] font-mono text-[#78716C]">
                    {memo.byteLength} Bytes
                  </span>
                  <a
                    href={`https://pudge.explorer.nervos.org/transaction/${memo.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg hover:bg-[#EAE1D2] text-[#78716C] hover:text-[#262320]"
                    title="View Cell Transaction on Explorer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Message Content */}
              <div className="bg-white p-3.5 rounded-lg border border-[#EBE4D8] text-xs font-sans text-[#262320] leading-relaxed break-words shadow-2xs">
                &ldquo;{memo.text}&rdquo;
              </div>

              {/* Hex Data */}
              <div className="text-[10px] font-mono text-[#A8A29E] truncate">
                Hex: {memo.dataHex}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
