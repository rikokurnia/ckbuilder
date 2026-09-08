"use client";

import React, { useState, useEffect } from "react";
import { X, Key, Check, ShieldAlert, ExternalLink } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  initialKey: string;
}

export function ApiKeyModal({ isOpen, onClose, onSave, initialKey }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState(initialKey);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setApiKey(initialKey);
  }, [initialKey]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(apiKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bounty-dark/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md border border-bounty-sage/40 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-bounty-deep px-6 py-4 flex items-center justify-between text-bounty-ice">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-bounty-cerulean" />
            <h3 className="text-sm font-bold">Google Gemini Flash Configuration</h3>
          </div>
          <button onClick={onClose} className="text-bounty-sage hover:text-bounty-ice">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          <p className="text-bounty-deep/80 leading-relaxed">
            The AI Worker connects directly to Google Gemini using the high-speed <strong>Gemini Flash</strong> model. You can set your API key in <code className="bg-bounty-ice px-1 py-0.5 rounded font-mono text-[11px]">.env</code> on the server or paste it below:
          </p>

          <div>
            <label className="block font-bold text-bounty-dark mb-1">Gemini API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 rounded-xl border border-bounty-sage/50 bg-bounty-ice/50 focus:bg-white focus:outline-none focus:border-bounty-cerulean text-bounty-dark font-mono text-xs"
            />
          </div>

          <div className="text-[11px] text-bounty-deep/70 flex items-center justify-between">
            <span>Don't have a key?</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-bounty-cerulean font-semibold hover:underline flex items-center space-x-1"
            >
              <span>Get free API key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-2.5 bg-bounty-ice rounded-xl border border-bounty-sage/30 text-[10px] text-bounty-deep">
            💡 <em>Note:</em> If left blank, the dApp automatically executes via the built-in CKB Security Analysis autonomous worker.
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-2 border-t border-bounty-ice">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-bounty-sage/50 text-bounty-deep font-semibold hover:bg-bounty-ice transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-bounty-deep hover:bg-bounty-cerulean text-bounty-ice font-bold shadow-md transition-all flex items-center space-x-1"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Key</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
