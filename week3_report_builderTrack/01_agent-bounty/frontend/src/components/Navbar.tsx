"use client";

import React, { useState, useEffect } from "react";
import { useCcc, useSigner, ccc } from "@ckb-ccc/connector-react";
import { Wallet, ShieldAlert, PlusCircle, Zap, Check, Copy, RefreshCw } from "lucide-react";
import { ChannelStats } from "@/lib/types";

interface NavbarProps {
  channel: ChannelStats | null;
  onOpenCreateModal: () => void;
  creatorSpentCkb?: number;
}

export function Navbar({ channel, onOpenCreateModal, creatorSpentCkb = 0 }: NavbarProps) {
  const { open, disconnect, client } = useCcc();
  const signer = useSigner();
  const [address, setAddress] = useState<string>("");
  const [rawBalance, setRawBalance] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAccount = async () => {
    if (!signer) {
      setAddress("");
      setRawBalance(0);
      return;
    }
    try {
      setIsRefreshing(true);
      const addr = await signer.getRecommendedAddress();
      const script = (await signer.getRecommendedAddressObj()).script;
      setAddress(addr);

      let sum = 0n;
      for await (const cell of client.findCells({ script, scriptType: "lock", scriptSearchMode: "exact" })) {
        sum += cell.cellOutput.capacity;
      }
      const raw = parseFloat(ccc.fixedPointToString(sum)) || 0;
      setRawBalance(raw);
    } catch (err) {
      console.error("Error fetching signer details:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAccount();
    const interval = setInterval(fetchAccount, 10000);
    return () => clearInterval(interval);
  }, [signer, client]);

  const effectiveBalance = Math.max(0, rawBalance - creatorSpentCkb);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 bg-bounty-deep text-bounty-ice shadow-lg border-b border-bounty-cerulean/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-bounty-cerulean to-bounty-deep border border-bounty-sage/40 flex items-center justify-center shadow-md">
            <Zap className="w-5 h-5 text-bounty-ice" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight text-bounty-ice">AgentBounty</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold bg-bounty-cerulean/60 text-bounty-ice px-2 py-0.5 rounded-full border border-bounty-sage/30">
                Fiber L2
              </span>
            </div>
            <p className="text-[11px] text-bounty-sage">Autonomous AI Marketplace on CKB</p>
          </div>
        </div>

        {/* Action Controls & Wallet */}
        <div className="flex items-center space-x-3">
          {/* Create Bounty Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-bounty-cerulean hover:bg-bounty-cerulean/80 text-bounty-ice shadow-md transition-all border border-bounty-sage/40"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Bounty</span>
          </button>

          {/* CCC Wallet Connector */}
          {!address ? (
            <button
              onClick={open}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-bounty-cerulean to-bounty-sage text-bounty-dark hover:brightness-110 shadow-md transition-all"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Connect Wallet</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2 bg-bounty-dark/40 border border-bounty-sage/30 px-3 py-1 rounded-lg">
              <div className="text-right">
                <div className="flex items-center space-x-1 text-[11px] font-medium text-bounty-ice">
                  <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
                  <button onClick={copyAddress} className="text-bounty-sage hover:text-bounty-ice">
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="text-[10px] text-bounty-sage flex items-center justify-end space-x-1">
                  <span>{effectiveBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CKB</span>
                  <button
                    onClick={fetchAccount}
                    title="Refresh CKB Balance"
                    className="hover:text-bounty-ice transition-transform active:rotate-180 p-0.5"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${isRefreshing ? "animate-spin text-bounty-cerulean" : ""}`} />
                  </button>
                </div>
              </div>
              <button
                onClick={disconnect}
                className="text-[10px] text-rose-300 hover:text-rose-100 underline ml-1"
              >
                Exit
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
