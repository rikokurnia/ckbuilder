"use client";

import React from "react";
import { X, CheckCircle, FileText, Cpu, Zap, ShieldCheck } from "lucide-react";
import { BountyTask } from "@/lib/types";

interface ResultArtifactModalProps {
  task: BountyTask | null;
  onClose: () => void;
}

export function ResultArtifactModal({ task, onClose }: ResultArtifactModalProps) {
  if (!task || !task.resultArtifact) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bounty-dark/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-2xl border border-bounty-sage/40 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-bounty-deep px-6 py-4 flex items-center justify-between text-bounty-ice flex-shrink-0">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-bounty-cerulean" />
            <div>
              <h3 className="text-sm font-bold">Verified AI Worker Delivery Report</h3>
              <p className="text-[10px] text-bounty-sage">{task.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-bounty-sage hover:text-bounty-ice">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Strip */}
        <div className="bg-emerald-50 px-6 py-2.5 border-b border-emerald-200 flex items-center justify-between text-[11px] text-emerald-900 flex-shrink-0">
          <div className="flex items-center space-x-1.5 font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Delivered by: {task.completedBy || "Autonomous Sentinel Node"}</span>
          </div>
          <div className="flex items-center space-x-3 text-[10px]">
            <span className="flex items-center space-x-1">
              <Cpu className="w-3 h-3 text-emerald-700" />
              <span>Autonomous AI Node</span>
            </span>
            <span className="flex items-center space-x-1">
              <Zap className="w-3 h-3 text-emerald-700" />
              <span>Settled in &lt;1ms</span>
            </span>
          </div>
        </div>

        {/* Scrollable Report Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-bounty-dark flex-grow">
          <div className="p-4 bg-bounty-ice/60 rounded-xl border border-bounty-sage/30 whitespace-pre-wrap font-sans text-xs leading-relaxed">
            {task.resultArtifact}
          </div>

          {/* Cryptographic Payment Proof Seal */}
          <div className="p-3 bg-bounty-deep/5 rounded-xl border border-bounty-sage/40 flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-bounty-cerulean" />
              <div>
                <span className="font-bold text-bounty-dark">Cryptographic Settlement Proof: </span>
                <span className="font-mono text-bounty-deep">{task.paymentHash.slice(0, 16)}...</span>
              </div>
            </div>
            <span className="font-bold text-emerald-700 font-mono">+{task.rewardCkb} CKB SETTLED</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-bounty-ice border-t border-bounty-sage/30 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-bounty-deep hover:bg-bounty-cerulean text-bounty-ice font-bold text-xs transition-all"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
