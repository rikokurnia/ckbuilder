"use client";

import React, { useState } from "react";
import { ccc, useCcc, useSigner } from "@ckb-ccc/connector-react";
import { Wallet, Copy, Check, ExternalLink, ShieldCheck, Coins, Hash } from "lucide-react";

interface WalletProfileCardProps {
  address: string;
  balance: string;
}

export function WalletProfileCard({ address, balance }: WalletProfileCardProps) {
  const { open, wallet } = useCcc();
  const signer = useSigner();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!signer || !address) {
    return (
      <div className="cream-card rounded-2xl p-6 border-2 border-dashed border-[#E5DCD0] flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <h3 className="font-semibold text-base text-[#262320]">
              Wallet Not Connected
            </h3>
            <p className="text-xs text-[#78716C]">
              Connect your Web3 wallet to inspect your live on-chain address and cell state.
            </p>
          </div>
        </div>

        <button
          onClick={() => open()}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold cream-btn-primary flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
        >
          <Wallet className="w-4 h-4" />
          <span>Connect Wallet</span>
        </button>
      </div>
    );
  }

  return (
    <div className="cream-card rounded-2xl p-6 mb-8 border border-[#EBE4D8] shadow-sm space-y-4">
      {/* Top row: Status and Balance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EBE4D8]">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-[#262320]">
            Connected Account ({wallet?.name || "Web3 Signer"})
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            CKB Testnet
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-[#D97706]" />
          <span className="text-xs text-[#78716C]">Available Balance:</span>
          <span className="text-sm font-bold font-mono text-[#B45309]">
            {parseFloat(balance).toLocaleString("en-US", { maximumFractionDigits: 2 })} CKB
          </span>
        </div>
      </div>

      {/* Main Address Display Box */}
      <div className="p-4 rounded-xl cream-card-subtle border border-[#E5DCD0] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#44403C] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#B45309]" />
            Your CKB Testnet Address (Layer 1):
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white hover:bg-[#FAF7F2] border border-[#E5DCD0] text-[#262320] flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#78716C]" />
                  <span>Copy Address</span>
                </>
              )}
            </button>

            <a
              href={`https://pudge.explorer.nervos.org/address/${address}`}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-white hover:bg-[#FAF7F2] border border-[#E5DCD0] text-[#78716C] hover:text-[#262320]"
              title="Open Address in CKB Explorer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="font-mono text-xs font-semibold text-[#262320] break-all bg-white p-3 rounded-lg border border-[#E7DFD5] select-all">
          {address}
        </div>
      </div>
    </div>
  );
}
