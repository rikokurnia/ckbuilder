"use client";

import React from "react";
import { ChannelStats } from "@/lib/types";
import { Layers, ShieldCheck, Zap, Activity, Cpu } from "lucide-react";

interface ChannelStatsCardProps {
  channel: ChannelStats | null;
}

export function ChannelStatsCard({ channel }: ChannelStatsCardProps) {
  if (!channel) return null;

  const creatorPercent = Math.round((channel.creatorBalanceCkb / channel.totalCapacityCkb) * 100);
  const workerPercent = 100 - creatorPercent;

  return (
    <div className="bg-white rounded-2xl p-5 border border-bounty-sage/40 shadow-sm glow-deep">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-bounty-ice">
        
        {/* Channel ID & Status */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-bounty-ice flex items-center justify-center text-bounty-cerulean">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-bounty-dark">Fiber Payment Channel</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                ACTIVE (FNN v0.9.0)
              </span>
            </div>
            <p className="text-xs text-bounty-deep/70 font-mono">{channel.channelId}</p>
          </div>
        </div>

        {/* L1 Guard Badge */}
        <div className="flex items-center space-x-2 bg-bounty-ice px-3 py-1.5 rounded-xl border border-bounty-sage/30 text-xs">
          <ShieldCheck className="w-4 h-4 text-bounty-cerulean" />
          <div>
            <span className="text-bounty-deep font-semibold">L1 Anchor: </span>
            <span className="font-mono text-bounty-dark">bounty-lock (RISC-V 17KB)</span>
          </div>
        </div>
      </div>

      {/* Channel Capacity Allocation */}
      <div className="mt-4">
        <div className="flex justify-between text-xs font-semibold mb-1.5">
          <span className="text-bounty-deep">
            Creator Capacity: <span className="font-mono text-bounty-dark">{channel.creatorBalanceCkb.toLocaleString()} CKB</span> ({creatorPercent}%)
          </span>
          <span className="text-bounty-cerulean">
            AI Worker Earned: <span className="font-mono text-bounty-dark">{channel.workerBalanceCkb.toLocaleString()} CKB</span> ({workerPercent}%)
          </span>
        </div>

        {/* Progress bar with theme colors */}
        <div className="w-full h-3 bg-bounty-ice rounded-full overflow-hidden flex border border-bounty-sage/30">
          <div
            className="h-full bg-gradient-to-r from-bounty-deep to-bounty-cerulean transition-all duration-500"
            style={{ width: `${creatorPercent}%` }}
          ></div>
          <div
            className="h-full bg-bounty-sage transition-all duration-500"
            style={{ width: `${workerPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Quick Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-bounty-ice text-xs">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <div>
            <div className="text-[10px] text-bounty-deep/70">Transaction Fee</div>
            <div className="font-bold text-bounty-dark">0.00 Gas (Off-Chain)</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-emerald-600" />
          <div>
            <div className="text-[10px] text-bounty-deep/70">Settlement Finality</div>
            <div className="font-bold text-bounty-dark">&lt; 1 ms (Sub-second)</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-bounty-cerulean" />
          <div>
            <div className="text-[10px] text-bounty-deep/70">Total Volume</div>
            <div className="font-bold text-bounty-dark">{channel.totalVolumeCkb} CKB</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-bounty-deep" />
          <div>
            <div className="text-[10px] text-bounty-deep/70">Settled Tasks</div>
            <div className="font-bold text-bounty-dark">{channel.settledCount} Bounties</div>
          </div>
        </div>
      </div>
    </div>
  );
}
