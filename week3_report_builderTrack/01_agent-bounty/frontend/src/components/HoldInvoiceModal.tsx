"use client";

import React, { useState } from "react";
import { X, Lock, CheckCircle2, ShieldCheck, Copy, Check, Hash, ArrowRight } from "lucide-react";
import { HoldInvoice } from "@/lib/types";

interface HoldInvoiceModalProps {
  invoice: HoldInvoice | null;
  onClose: () => void;
}

export function HoldInvoiceModal({ invoice, onClose }: HoldInvoiceModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!invoice) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bounty-dark/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-lg border border-bounty-sage/40 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-bounty-deep px-6 py-4 flex items-center justify-between text-bounty-ice">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-bounty-cerulean" />
            <div>
              <h3 className="text-sm font-bold">Fiber Network Hold Invoice Inspector</h3>
              <p className="text-[10px] text-bounty-sage font-mono">{invoice.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-bounty-sage hover:text-bounty-ice">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          
          {/* HTLC State Transition Progression */}
          <div className="bg-bounty-ice p-4 rounded-xl border border-bounty-sage/30">
            <div className="text-[11px] font-bold text-bounty-deep mb-2">HTLC Off-Chain Lifecycle</div>
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex flex-col items-center">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold mb-1 ${
                  invoice.status === 'OPEN' || invoice.status === 'HELD' || invoice.status === 'SETTLED'
                    ? 'bg-bounty-deep text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  1
                </span>
                <span className="font-semibold text-bounty-dark">OPEN</span>
                <span className="text-[9px] text-gray-500">Hash Sealed</span>
              </div>

              <ArrowRight className="w-4 h-4 text-bounty-sage" />

              <div className="flex flex-col items-center">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold mb-1 ${
                  invoice.status === 'HELD' || invoice.status === 'SETTLED'
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  2
                </span>
                <span className="font-semibold text-bounty-dark">HELD</span>
                <span className="text-[9px] text-gray-500">Capacity Escrowed</span>
              </div>

              <ArrowRight className="w-4 h-4 text-bounty-sage" />

              <div className="flex flex-col items-center">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold mb-1 ${
                  invoice.status === 'SETTLED'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  3
                </span>
                <span className="font-semibold text-bounty-dark">SETTLED</span>
                <span className="text-[9px] text-gray-500">Preimage Verified</span>
              </div>
            </div>
          </div>

          {/* Amount & Status Badge */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-bounty-ice/50 rounded-xl border border-bounty-sage/30">
              <span className="text-[10px] text-bounty-deep/70 block">Escrow Amount</span>
              <span className="text-base font-extrabold text-bounty-dark font-mono">{invoice.amountCkb} CKB</span>
            </div>

            <div className="p-3 bg-bounty-ice/50 rounded-xl border border-bounty-sage/30">
              <span className="text-[10px] text-bounty-deep/70 block">Current Status</span>
              <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                invoice.status === 'SETTLED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : invoice.status === 'HELD'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-bounty-deep/10 text-bounty-deep'
              }`}>
                {invoice.status}
              </span>
            </div>
          </div>

          {/* Target Payment Hash H = SHA256(P) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-bounty-dark flex items-center space-x-1">
                <Hash className="w-3.5 h-3.5 text-bounty-cerulean" />
                <span>Target Payment Hash (H = SHA-256(P))</span>
              </label>
              <button
                onClick={() => copyToClipboard(invoice.paymentHash, 'hash')}
                className="text-bounty-deep hover:text-bounty-cerulean flex items-center space-x-1"
              >
                {copiedField === 'hash' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span className="text-[10px]">{copiedField === 'hash' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-2.5 bg-bounty-ice/70 rounded-xl border border-bounty-sage/40 font-mono text-[11px] text-bounty-dark break-all">
              {invoice.paymentHash}
            </div>
          </div>

          {/* Cryptographic Secret Preimage P */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-bounty-dark flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Secret Preimage (P)</span>
              </label>
              {invoice.preimage && (
                <button
                  onClick={() => copyToClipboard(invoice.preimage!, 'preimage')}
                  className="text-bounty-deep hover:text-bounty-cerulean flex items-center space-x-1"
                >
                  {copiedField === 'preimage' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span className="text-[10px]">{copiedField === 'preimage' ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>
            {invoice.preimage ? (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl font-mono text-[11px] text-emerald-900 break-all">
                {invoice.preimage}
              </div>
            ) : (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 italic">
                🔒 Hidden by Autonomous AI Worker. Will be revealed atomically upon task completion.
              </div>
            )}
          </div>

          {/* Action Close */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-bounty-deep hover:bg-bounty-cerulean text-bounty-ice font-bold transition-all text-xs"
            >
              Close Inspector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
