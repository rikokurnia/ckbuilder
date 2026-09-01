"use client";

import React, { useState, useEffect } from "react";
import { ccc, useCcc, useSigner } from "@ckb-ccc/connector-react";
import { Navbar } from "@/components/Navbar";
import { ConceptCards } from "@/components/ConceptCards";
import { PostMemoCard } from "@/components/PostMemoCard";
import { MemoFeed } from "@/components/MemoFeed";
import { CapacityCalculator } from "@/components/CapacityCalculator";
import { Sparkles, Layers, ShieldCheck, ExternalLink } from "lucide-react";

export default function Home() {
  const { client } = useCcc();
  const cccSigner = useSigner();
  const [customSigner, setCustomSigner] = useState<ccc.Signer | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tipBlock, setTipBlock] = useState<string>("...");
  const [address, setAddress] = useState<string>("");

  const activeSigner = customSigner || cccSigner || null;

  // Poll tip block
  useEffect(() => {
    let isMounted = true;
    async function fetchTip() {
      try {
        const header = await client.getTipHeader();
        if (isMounted) setTipBlock(header.number.toString());
      } catch (err) {
        console.error("Tip error:", err);
      }
    }
    fetchTip();
    const interval = setInterval(fetchTip, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [client]);

  // Sync address
  useEffect(() => {
    let isMounted = true;
    async function fetchAddress() {
      if (!activeSigner) {
        setAddress("");
        return;
      }
      try {
        const addr = await activeSigner.getRecommendedAddress();
        if (isMounted) setAddress(addr);
      } catch (err) {
        console.error("Address error:", err);
      }
    }
    fetchAddress();
  }, [activeSigner]);

  const handleRefreshFeed = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      {/* Top Navbar */}
      <Navbar
        customSigner={customSigner}
        setCustomSigner={setCustomSigner}
        onRefreshFeed={handleRefreshFeed}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-3 pt-2 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full cream-badge text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Nervos CKB • Common Chain Connector (CCC) Demo</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#262320]">
            Decentralized On-Chain Memo Board
          </h1>

          <p className="text-sm text-[#78716C] leading-relaxed">
            Write immutable messages directly into CKB cell capacity storage while learning the 5 core architectural concepts of CCC:{" "}
            <span className="font-semibold text-[#B45309]">Client</span>,{" "}
            <span className="font-semibold text-[#B45309]">Address</span>,{" "}
            <span className="font-semibold text-[#B45309]">Signer</span>,{" "}
            <span className="font-semibold text-[#B45309]">Cell Model</span>, and{" "}
            <span className="font-semibold text-[#B45309]">Transaction</span>.
          </p>
        </section>

        {/* 5 Core Concepts Interactive Explorer */}
        <ConceptCards
          signer={activeSigner}
          address={address}
          tipBlock={tipBlock}
        />

        {/* DApp Grid: Post Memo & Calculator on Left, Memo Feed on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Post Memo & Capacity Calculator */}
          <div className="lg:col-span-5 space-y-8">
            <PostMemoCard
              customSigner={customSigner}
              onMemoPosted={handleRefreshFeed}
            />
            <CapacityCalculator />
          </div>

          {/* Right Column: Live On-Chain Memos Feed */}
          <div className="lg:col-span-7">
            <MemoFeed
              customSigner={customSigner}
              refreshKey={refreshKey}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[#EBE4D8] bg-[#FBF8F3] py-8 px-4 text-center text-xs text-[#78716C]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#D97706]" />
            <span className="font-semibold text-[#262320]">CKB Memo Vault</span>
            <span>• Week 1 Report Section 04</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://docs.ckbccc.com/en/docs/concepts/cell-model"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#B45309] flex items-center gap-1"
            >
              <span>CCC Documentation</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://pudge.explorer.nervos.org"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#B45309] flex items-center gap-1"
            >
              <span>CKB Testnet Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
