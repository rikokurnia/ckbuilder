"use client";

import React, { useEffect, useState } from "react";
import { useCcc, useSigner, ccc } from "@ckb-ccc/connector-react";
import { Wallet, Key, CheckCircle2, RefreshCw, Layers, ExternalLink, ShieldCheck } from "lucide-react";

interface NavbarProps {
  customSigner: ccc.Signer | null;
  setCustomSigner: (signer: ccc.Signer | null) => void;
  onRefreshFeed: () => void;
}

export function Navbar({ customSigner, setCustomSigner, onRefreshFeed }: NavbarProps) {
  const { open, disconnect, client } = useCcc();
  const cccSigner = useSigner();
  const [tipBlock, setTipBlock] = useState<string>("Loading...");
  const [address, setAddress] = useState<string>("");
  const [balance, setBalance] = useState<string>("0");
  const [isPrivKeyModalOpen, setIsPrivKeyModalOpen] = useState(false);
  const [privKeyInput, setPrivKeyInput] = useState(
    "0x1afb1c688691e2eddadaca9230273630c26f9abbcc1f31056b38b05d11cc3574"
  );

  const activeSigner = customSigner || cccSigner;

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

  // Fetch address & balance whenever active signer changes
  useEffect(() => {
    let isMounted = true;
    async function fetchAccount() {
      if (!activeSigner) {
        setAddress("");
        setBalance("0");
        return;
      }
      try {
        const addr = await activeSigner.getRecommendedAddress();
        const script = (await activeSigner.getRecommendedAddressObj()).script;
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
  }, [activeSigner, client]);

  const handleApplyPrivateKey = () => {
    try {
      const s = new ccc.SignerCkbPrivateKey(client, privKeyInput.trim());
      setCustomSigner(s);
      setIsPrivKeyModalOpen(false);
    } catch (err) {
      alert("Invalid Private Key: " + (err as Error).message);
    }
  };

  const handleDisconnect = () => {
    if (customSigner) {
      setCustomSigner(null);
    }
    if (cccSigner) {
      disconnect();
    }
  };

  return (
    <>
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
              className="p-2 rounded-lg cream-btn-secondary text-[#57534E] hover:text-[#262320]"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Account / Connect Buttons */}
            {activeSigner && address ? (
              <div className="flex items-center gap-2">
                <div className="flex flex-col text-right px-3 py-1 rounded-lg cream-card-subtle text-xs border border-[#E5DCD0]">
                  <span className="font-medium text-[#262320]">
                    {parseFloat(balance).toLocaleString("en-US", { maximumFractionDigits: 2 })} CKB
                  </span>
                  <span className="text-[10px] text-[#78716C] font-mono">
                    {address.slice(0, 7)}...{address.slice(-6)}
                  </span>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium cream-btn-secondary text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrivKeyModalOpen(true)}
                  className="px-3 py-2 rounded-lg text-xs font-medium cream-btn-secondary flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>Dev Private Key</span>
                </button>

                <button
                  onClick={() => open()}
                  className="px-4 py-2 rounded-lg text-xs font-medium cream-btn-primary flex items-center gap-1.5"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Connect Wallet</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Dev Private Key Modal */}
      {isPrivKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cream-card max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#FEF3C7] text-[#B45309]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base text-[#262320]">
                  Funded Testnet Signer
                </h3>
              </div>
              <button
                onClick={() => setIsPrivKeyModalOpen(false)}
                className="text-[#A8A29E] hover:text-[#262320] text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#57534E] leading-relaxed">
              Use your funded CKB Testnet private key to sign and broadcast on-chain memos directly via{" "}
              <code className="px-1.5 py-0.5 rounded bg-[#F5EFE4] text-[#B45309] font-mono text-[11px]">
                ccc.SignerCkbPrivateKey
              </code>
              .
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#44403C]">
                Private Key (Hex 32-bytes):
              </label>
              <textarea
                rows={2}
                value={privKeyInput}
                onChange={(e) => setPrivKeyInput(e.target.value)}
                className="w-full cream-input rounded-xl p-3 text-xs font-mono resize-none"
                placeholder="0x..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsPrivKeyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium cream-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyPrivateKey}
                className="px-4 py-2 rounded-xl text-xs font-medium cream-btn-primary"
              >
                Activate Signer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
