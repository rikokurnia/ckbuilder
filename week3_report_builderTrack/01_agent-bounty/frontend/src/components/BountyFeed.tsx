"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Lock,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Bot,
  Zap,
} from "lucide-react";
import { BountyTask, HoldInvoice } from "@/lib/types";

interface BountyFeedProps {
  bounties: BountyTask[];
  invoices: HoldInvoice[];
  onExecuteAgent: (taskId: string) => Promise<void>;
  onInspectInvoice: (invoice: HoldInvoice) => void;
  onViewArtifact: (task: BountyTask) => void;
  executingTaskId: string | null;
}

export function BountyFeed({
  bounties,
  invoices,
  onExecuteAgent,
  onInspectInvoice,
  onViewArtifact,
  executingTaskId,
}: BountyFeedProps) {
  const [filter, setFilter] = useState<string>("ALL");

  const filtered = bounties.filter((b) => {
    if (filter === "ALL") return true;
    return b.status === filter;
  });

  const getInvoiceForTask = (invoiceId: string) => {
    return invoices.find((inv) => inv.id === invoiceId) || null;
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-bounty-sage/30">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-bounty-deep" />
          <h2 className="text-base font-extrabold text-bounty-dark">Active Bounty Marketplace</h2>
          <span className="text-xs bg-bounty-ice text-bounty-deep font-bold px-2 py-0.5 rounded-full border border-bounty-sage/40">
            {bounties.length}
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 text-xs bg-bounty-ice p-1 rounded-xl border border-bounty-sage/30">
          {["ALL", "OPEN", "IN_PROGRESS", "COMPLETED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filter === st
                  ? "bg-bounty-deep text-bounty-ice shadow-sm"
                  : "text-bounty-deep/70 hover:text-bounty-dark"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Cards */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-bounty-sage/40 text-bounty-deep/60 text-xs">
          No bounties found in this category. Create one using the button above!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((task) => {
            const invoice = getInvoiceForTask(task.invoiceId);
            const isExecuting = executingTaskId === task.id;

            return (
              <div
                key={task.id}
                className="bg-white rounded-2xl p-5 border border-bounty-sage/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Category & Reward */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-bounty-ice text-bounty-deep border border-bounty-sage/30 uppercase tracking-wider">
                      {task.category.replace("_", " ")}
                    </span>

                    <div className="flex items-center space-x-1 font-mono font-extrabold text-bounty-deep text-sm bg-bounty-ice/80 px-2.5 py-0.5 rounded-lg border border-bounty-sage/30">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{task.rewardCkb} CKB</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-bold text-bounty-dark mb-1.5 leading-snug line-clamp-1">
                    {task.title}
                  </h3>
                  <p className="text-xs text-bounty-deep/80 line-clamp-2 mb-3 leading-relaxed">
                    {task.prompt}
                  </p>
                </div>

                {/* Card Footer: Status & Actions */}
                <div className="pt-3 border-t border-bounty-ice/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  
                  {/* Status Badge */}
                  <div className="flex items-center space-x-1.5">
                    {task.status === "COMPLETED" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                        SETTLED
                      </span>
                    ) : task.status === "IN_PROGRESS" || isExecuting ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                        <Clock className="w-3 h-3 mr-1 text-amber-600 animate-spin" />
                        WORKING (HELD)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-bounty-ice text-bounty-deep border border-bounty-sage/40">
                        <Lock className="w-3 h-3 mr-1 text-bounty-cerulean" />
                        OPEN (FIBER)
                      </span>
                    )}

                    {invoice && (
                      <button
                        onClick={() => onInspectInvoice(invoice)}
                        className="text-[10px] font-mono text-bounty-cerulean hover:underline flex items-center space-x-0.5"
                        title="Inspect Hold Invoice"
                      >
                        <span>{invoice.id.slice(0, 11)}...</span>
                      </button>
                    )}
                  </div>

                  {/* Primary Trigger Action */}
                  <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                    {task.status === "COMPLETED" ? (
                      <button
                        onClick={() => onViewArtifact(task)}
                        className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-bounty-deep hover:bg-bounty-cerulean text-bounty-ice text-xs font-bold transition-all shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Result</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onExecuteAgent(task.id)}
                        disabled={isExecuting}
                        className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-sm ${
                          isExecuting
                            ? "bg-amber-500 text-white cursor-wait"
                            : "bg-gradient-to-r from-bounty-cerulean to-bounty-deep hover:brightness-110 text-bounty-ice"
                        }`}
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isExecuting ? "animate-spin" : ""}`} />
                        <span>{isExecuting ? "Executing Task..." : "Dispatch Agent Worker"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
