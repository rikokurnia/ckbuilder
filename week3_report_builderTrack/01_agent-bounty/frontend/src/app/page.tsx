"use client";

import React, { useState, useEffect } from "react";
import { useSigner } from "@ckb-ccc/connector-react";
import { Navbar } from "@/components/Navbar";
import { ChannelStatsCard } from "@/components/ChannelStatsCard";
import { BountyFeed } from "@/components/BountyFeed";
import { CreateBountyModal } from "@/components/CreateBountyModal";
import { HoldInvoiceModal } from "@/components/HoldInvoiceModal";
import { ResultArtifactModal } from "@/components/ResultArtifactModal";
import { BountyTask, HoldInvoice, ChannelStats } from "@/lib/types";
import { Zap, Sparkles, Cpu } from "lucide-react";

export default function Home() {
  const signer = useSigner();
  const [address, setAddress] = useState<string>("");

  const [bounties, setBounties] = useState<BountyTask[]>([]);
  const [invoices, setInvoices] = useState<HoldInvoice[]>([]);
  const [channel, setChannel] = useState<ChannelStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<HoldInvoice | null>(null);
  const [selectedArtifactTask, setSelectedArtifactTask] = useState<BountyTask | null>(null);

  // Execution state
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  // Fetch connected address
  useEffect(() => {
    async function loadAddress() {
      if (signer) {
        try {
          const addr = await signer.getRecommendedAddress();
          setAddress(addr);
        } catch (e) {
          console.error(e);
        }
      } else {
        setAddress("");
      }
    }
    loadAddress();
  }, [signer]);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bounties");
      const json = await res.json();
      if (json.success) {
        setBounties(json.data.bounties);
        setInvoices(json.data.invoices);
        setChannel(json.data.channel);
      }
    } catch (err) {
      console.error("Error loading bounties:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message: string, type: "success" | "info" | "error" = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Deploy AI agent to solve a task
  const handleExecuteAgent = async (taskId: string) => {
    setExecutingTaskId(taskId);
    showToast("Dispatching Autonomous Intelligence Node & escrowing Fiber Hold Invoice...", "info");

    try {
      const res = await fetch("/api/execute-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          workerName: "Autonomous Sentinel Node",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Agent execution failed");
      }

      await fetchData();
      const updatedTask = json.data.task;
      setSelectedArtifactTask(updatedTask);
      showToast(
        `Bounty Completed! Cryptographic Preimage verified & ${updatedTask.rewardCkb} CKB settled in <1ms!`,
        "success"
      );
    } catch (err: any) {
      showToast(err.message || "Failed to execute AI agent", "error");
    } finally {
      setExecutingTaskId(null);
    }
  };

  // Compute total bounty rewards committed by creator (excluding seed demo task)
  const creatorSpentCkb = bounties
    .filter((b) => b.id !== "task_seed_01" && (
      !address || 
      b.creator === address || 
      b.creator?.toLowerCase() === address.toLowerCase() || 
      b.creator === "ckb1_connected_wallet"
    ))
    .reduce((acc, b) => acc + b.rewardCkb, 0);

  return (
    <div className="min-h-screen flex flex-col bg-bounty-ice">
      {/* Top Navigation */}
      <Navbar
        channel={channel}
        onOpenCreateModal={() => setIsCreateOpen(true)}
        creatorSpentCkb={creatorSpentCkb}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center space-x-2 ${
              notification.type === "success"
                ? "bg-emerald-600 text-white border-emerald-400"
                : notification.type === "error"
                ? "bg-rose-600 text-white border-rose-400"
                : "bg-bounty-deep text-bounty-ice border-bounty-sage/50"
            }`}
          >
            <Sparkles className="w-4 h-4 text-bounty-cerulean" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow space-y-8">
        
        {/* Sleek Executive Header */}
        <section className="bg-gradient-to-r from-bounty-deep to-bounty-cerulean rounded-2xl p-6 text-bounty-ice shadow-md border border-bounty-sage/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center space-x-2 text-[11px] font-semibold text-bounty-sage tracking-wider uppercase">
              <Cpu className="w-3.5 h-3.5 text-bounty-sage" />
              <span>Nervos CKB &amp; Fiber Network L2</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              AgentBounty Marketplace
            </h1>
            <p className="text-xs text-bounty-ice/85 leading-relaxed">
              Decentralized autonomous task escrow powered by CKB-VM contracts and off-chain HTLC Hold Invoices with sub-second atomic settlement.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 flex-shrink-0">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-bounty-ice text-bounty-dark font-bold text-xs hover:bg-white transition-all shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-bounty-deep" />
              <span>Publish Bounty</span>
            </button>
          </div>
        </section>

        {/* Channel Telemetry Card */}
        <section>
          <ChannelStatsCard channel={channel} />
        </section>

        {/* Bounty Marketplace Feed */}
        <section>
          <BountyFeed
            bounties={bounties}
            invoices={invoices}
            onExecuteAgent={handleExecuteAgent}
            onInspectInvoice={(inv) => setSelectedInvoice(inv)}
            onViewArtifact={(tsk) => setSelectedArtifactTask(tsk)}
            executingTaskId={executingTaskId}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-bounty-deep text-bounty-sage py-5 border-t border-bounty-cerulean/30 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            <span className="font-bold text-bounty-ice">AgentBounty</span> — Decentralized Autonomous Task Protocol
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>CKB-VM (RISC-V)</span>
            <span>•</span>
            <span>Fiber Network L2</span>
            <span>•</span>
            <span>CCC Connector</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateBountyModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          fetchData();
          showToast("New Bounty Created & Locked in Fiber Channel!", "success");
        }}
        creatorAddress={address}
      />

      <HoldInvoiceModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

      <ResultArtifactModal
        task={selectedArtifactTask}
        onClose={() => setSelectedArtifactTask(null)}
      />
    </div>
  );
}
