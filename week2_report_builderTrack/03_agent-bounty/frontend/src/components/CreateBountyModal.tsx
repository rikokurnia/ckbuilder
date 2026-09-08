"use client";

import React, { useState } from "react";
import { X, PlusCircle, ShieldAlert, Sparkles, Hash } from "lucide-react";
import { TaskCategory } from "@/lib/types";

interface CreateBountyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  creatorAddress: string;
}

export function CreateBountyModal({
  isOpen,
  onClose,
  onCreated,
  creatorAddress,
}: CreateBountyModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory>("CODE_AUDIT");
  const [rewardCkb, setRewardCkb] = useState("250");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // Preset templates for quick testing
  const applyPreset = (type: "audit" | "research") => {
    if (type === "audit") {
      setTitle("CKB bounty-lock Witness Validation Audit");
      setCategory("CODE_AUDIT");
      setRewardCkb("350");
      setPrompt(
        "Analyze the witness unpacking routine in the bounty-lock Rust contract:\n" +
        "Check whether empty witness bytes or malformed unlock mode flags can trigger panics on CKB-VM.\n" +
        "Verify capacity conservation check when load_cell_capacity returns u64::MAX."
      );
    } else {
      setTitle("Deep Research: 2026 Machine Payments on Fiber vs Lightning");
      setCategory("DEEP_RESEARCH");
      setRewardCkb("400");
      setPrompt(
        "Synthesize the trade-offs between Fiber Network Hold Invoices and Bitcoin Lightning L402 for autonomous AI agents.\n" +
        "Focus on multi-asset routing (xUDT/sUDT) and on-chain dispute finality."
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !prompt || !rewardCkb) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Generate random 32-byte cryptographic preimage and compute payment hash in browser
      const randomBytes = new Uint8Array(32);
      window.crypto.getRandomValues(randomBytes);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", randomBytes);
      const paymentHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // 2. Post to backend
      const res = await fetch("/api/bounties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: title,
          category,
          prompt,
          rewardCkb: Number(rewardCkb),
          creator: creatorAddress || "ckb1_connected_wallet",
          paymentHash,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to publish bounty");
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to publish bounty");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bounty-dark/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-lg border border-bounty-sage/40 shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-bounty-deep px-6 py-4 flex items-center justify-between text-bounty-ice">
          <div className="flex items-center space-x-2">
            <PlusCircle className="w-5 h-5 text-bounty-cerulean" />
            <h3 className="text-base font-bold">Create Autonomous AI Bounty</h3>
          </div>
          <button onClick={onClose} className="text-bounty-sage hover:text-bounty-ice transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <span className="text-[11px] font-semibold text-bounty-deep/70">Quick Presets: </span>
            <div className="inline-flex space-x-2 ml-2">
              <button
                type="button"
                onClick={() => applyPreset("audit")}
                className="px-2 py-0.5 rounded bg-bounty-ice text-bounty-cerulean font-medium hover:bg-bounty-cerulean/10 border border-bounty-sage/30"
              >
                Code Audit
              </button>
              <button
                type="button"
                onClick={() => applyPreset("research")}
                className="px-2 py-0.5 rounded bg-bounty-ice text-bounty-deep font-medium hover:bg-bounty-deep/10 border border-bounty-sage/30"
              >
                Deep Research
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-bold text-bounty-dark mb-1">Task Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. CKB Smart Contract Reentrancy Audit"
              className="w-full px-3 py-2 rounded-xl border border-bounty-sage/50 bg-bounty-ice/50 focus:bg-white focus:outline-none focus:border-bounty-cerulean text-bounty-dark text-xs"
            />
          </div>

          {/* Category & Reward */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-bounty-dark mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 rounded-xl border border-bounty-sage/50 bg-bounty-ice/50 focus:bg-white focus:outline-none focus:border-bounty-cerulean text-bounty-dark text-xs"
              >
                <option value="CODE_AUDIT">Code Audit (Security)</option>
                <option value="DEEP_RESEARCH">Deep Research & Analysis</option>
                <option value="DATA_EXTRACTION">Data Extraction & Mining</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-bounty-dark mb-1">Bounty Reward (CKB)</label>
              <input
                type="number"
                min="10"
                max="5000"
                required
                value={rewardCkb}
                onChange={(e) => setRewardCkb(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-bounty-sage/50 bg-bounty-ice/50 focus:bg-white focus:outline-none focus:border-bounty-cerulean text-bounty-dark font-mono text-xs"
              />
            </div>
          </div>

          {/* Prompt Instruction */}
          <div>
            <label className="block font-bold text-bounty-dark mb-1">
              AI Worker Prompt / Specification
            </label>
            <textarea
              rows={4}
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the task for the autonomous AI agent (e.g. paste code snippet or research question)..."
              className="w-full px-3 py-2 rounded-xl border border-bounty-sage/50 bg-bounty-ice/50 focus:bg-white focus:outline-none focus:border-bounty-cerulean text-bounty-dark text-xs"
            />
          </div>

          {/* Escrow note */}
          <div className="p-3 bg-bounty-ice rounded-xl border border-bounty-sage/30 text-[11px] text-bounty-deep flex items-start space-x-2">
            <Hash className="w-4 h-4 text-bounty-cerulean flex-shrink-0 mt-0.5" />
            <div>
              <strong>Fiber Hold Invoice Escrow:</strong> Submitting will lock{" "}
              <span className="font-bold font-mono">{rewardCkb} CKB</span> in the off-chain HTLC channel. Funds will only be settled once the AI reveals the valid cryptographic preimage alongside its verified report.
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2 pt-2 border-t border-bounty-ice">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-bounty-sage/50 text-bounty-deep font-semibold hover:bg-bounty-ice transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-bounty-deep hover:bg-bounty-cerulean text-bounty-ice font-bold shadow-md transition-all flex items-center space-x-1.5"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Locking in Fiber...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Publish &amp; Lock Bounty</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
