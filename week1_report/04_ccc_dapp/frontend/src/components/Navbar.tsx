"use client";

import React, { useEffect, useState } from "react";
import { useCcc, useSigner, ccc } from "@ckb-ccc/connector-react";
import { Wallet, RefreshCw, Layers, Copy, Check } from "lucide-react";

interface NavbarProps {
  onRefreshFeed: () => void;
}

export function Navbar({ onRefreshFeed }: NavbarProps) {
  const { open, disconnect, client } = useCcc();
  const signer = useSigner();
  const [tipBlock, setTipBlock] = useState<string>("Loading...");
  const [address, setAddress] = useState<string>("" );
  const [balance, setBalance] = useState<string>("0");
  const [copied, setCopied] = useState(false);

  // Poll tip block height
  useEffect(() => {
    let isMounted = true;
    async function fetchTip() {
      try {
        const header = await client.getTipHeader();
        if (isMounted) setTipBlock(header.number.toString());
      } catch (err) {
        console.error("Error fetching tip:", err);
      }
    }

    fetchTip();
    const interval = setInterval(fetchTip, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [client]);

  // Fetch address & balance whenever signer changes
  useEffect(() => {
    let isMounted = true;
    async function fetchAccount() {
      if (!signer) {
        setAddress("");
        setBalance("0");
        return;
      }
      try {
        const addr = await signer.getRecommendedAddress();
        const script = (await signer.getRecommendedAddressObj()).script;
        if (!isMounted) return;
        setAddress(addr);

        let sum = 0n;
        for await (const cell of client.findCells({ script, scriptType: "lock", scriptSearchMode: "exact" })) {
          sum += cell.cellOutput.capacity;
        }
        if (isMounted) setBalance(ccc.fixedPointToString(sum));
      } catch (err) {
        console.error("Error fetching signer details:", err);
      }
    }

    fetchAccount();
  }, [signer, client]);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#EBE4D8] px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D97706] to-[#92400E] flex items-center justify-center text-white shadow-sm font-bold text-lg">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-lg text-[#262320] tracking-tight">
                CKB Memo Vault
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                CCC Core Demo
              </span>
            </div>
            <p className="text-xs text-[#78716C] hidden sm:block">
              On-Chain Cell State Storage • Testnet (Pudge)
            </p>
          </div>
        </div>

        {/* Network & Actions */}
        <div className="flex items-center gap-3">
          {/* Live Block Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg cream-card-subtle text-xs text-[#57534E]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Tip #{tipBlock}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefreshFeed}
            title="Refresh On-Chain Memos"
            className="p-2 rounded-lg cream-btn-secondary text-[#57534E] hover:text-[#262320] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Account / Connect Button */}
          {signer && address ? (
            <div className="flex items-center gap-2">
              {/* Clickable Address & Balance Badge */}
              <button
                onClick={handleCopy}
                title="Click to copy full address"
                className="flex items-center gap-2.5 text-left px-3.5 py-1.5 rounded-xl cream-card-subtle hover:border-[#D97706] border border-[#E5DCD0] text-xs cursor-pointer transition-all shadow-2xs group"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-[#262320]">
                    {parseFloat(balance).toLocaleString("en-US", { maximumFractionDigits: 2 })} CKB
                  </span>
                  <span className="text-[10px] text-[#78716C] font-mono group-hover:text-[#B45309]">
                    {address.slice(0, 8)}...{address.slice(-6)}
                  </span>
                </div>

                <div className="p-1 rounded-md bg-white border border-[#E5DCD0] text-[#78716C] group-hover:text-[#B45309] shrink-0">
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </div>
              </button>

              <button
                onClick={() => disconnect()}
                className="px-3 py-2 rounded-xl text-xs font-medium cream-btn-secondary text-rose-700 hover:bg-rose-50 border-rose-200 cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => open()}
              className="px-4 py-2 rounded-lg text-xs font-medium cream-btn-primary flex items-center gap-1.5 cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Connect Wallet (MetaMask / JoyID)</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
