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
import { Shield, Zap, Sparkles, BookOpen, ExternalLink, RefreshCw, Cpu, CheckCircle } from "lucide-react";

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
        
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-bounty-deep via-bounty-deep to-bounty-cerulean rounded-3xl p-6 sm:p-8 text-bounty-ice shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center space-x-2 bg-bounty-ice/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-bounty-ice border border-bounty-sage/30">
              <Cpu className="w-3.5 h-3.5 text-bounty-sage" />
              <span>Nervos CKB &amp; Fiber Network — Autonomous Machine Economy</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Zero-Trust Autonomous AI Labor Marketplace
            </h1>

            <p className="text-xs sm:text-sm text-bounty-ice/85 leading-relaxed">
              Solving the <em>fair-exchange dilemma</em> in machine-to-machine economies. Task creators escrow bounty liquidity into off-chain <strong>Fiber Hold Invoices</strong>, while autonomous intelligence agents execute verifiable computational tasks, delivering cryptographic preimages for sub-second atomic settlement on Nervos CKB.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
              <a
                href="https://talk.nervos.org/t/ai-machine-payments-and-fiber-in-2026-an-opportunity-map-for-ckb-and-fiber-developers/10665"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-bounty-ice text-bounty-dark font-bold hover:bg-white transition-all shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5 text-bounty-deep" />
                <span>Nervos 2026 Opportunity Map</span>
                <ExternalLink className="w-3 h-3 text-bounty-sage" />
              </a>

              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-bounty-cerulean hover:bg-bounty-cerulean/80 text-bounty-ice font-bold transition-all border border-bounty-sage/40"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Publish Bounty Task</span>
              </button>
            </div>
          </div>

          {/* Decorative Background Accents */}
          <div className="absolute right-0 bottom-0 w-80 h-80 bg-bounty-sage/10 rounded-full blur-3xl pointer-events-none"></div>
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

        {/* Technical Architecture Matrix */}
        <section className="bg-white rounded-2xl p-6 border border-bounty-sage/40 shadow-sm text-xs text-bounty-dark space-y-4">
          <div className="flex items-center justify-between border-b border-bounty-ice pb-3">
            <h3 className="font-extrabold text-sm text-bounty-dark flex items-center space-x-2">
              <Shield className="w-4 h-4 text-bounty-cerulean" />
              <span>Full-Stack Technical Architecture Overview</span>
            </h3>
            <span className="text-[11px] text-bounty-sage font-mono">Zero-Trust Architecture</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-bounty-ice/50 border border-bounty-sage/30 space-y-2">
              <div className="font-bold text-bounty-deep flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-bounty-deep"></span>
                <span>Layer 1: CKB-VM Rust Contract</span>
              </div>
              <p className="text-bounty-deep/80 text-[11px] leading-relaxed">
                Bare-metal <strong><code>bounty-lock</code></strong> compiled to <strong>RISC-V</strong> (17 KB binary). Enforces capacity conservation and autonomous timeout refund rules on-chain.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-bounty-ice/50 border border-bounty-sage/30 space-y-2">
              <div className="font-bold text-bounty-cerulean flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-bounty-cerulean"></span>
                <span>Layer 2: Fiber Hold Invoices</span>
              </div>
              <p className="text-bounty-deep/80 text-[11px] leading-relaxed">
                Off-chain conditional HTLC payment channels. Zero gas fees, sub-millisecond execution, and cryptographic preimage atomic release.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-bounty-ice/50 border border-bounty-sage/30 space-y-2">
              <div className="font-bold text-emerald-700 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Worker: Autonomous Intelligence Node</span>
              </div>
              <p className="text-bounty-deep/80 text-[11px] leading-relaxed">
                High-throughput autonomous agent reasoning and security verification engine. Generates cryptographically verifiable outputs and reveals matching preimages for instant off-chain finality.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-bounty-deep text-bounty-sage py-6 border-t border-bounty-cerulean/30 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-bold text-bounty-ice">AgentBounty</span> — Built by{" "}
            <span className="text-bounty-ice font-semibold">Riko Kurnia Sandi</span> for Nervos CKB Builder Track.
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>CKB-VM (RISC-V)</span>
            <span>•</span>
            <span>Fiber Network v0.9.0</span>
            <span>•</span>
            <span>Autonomous Intelligence Engine</span>
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
