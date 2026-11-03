"use client";

import React, { useState } from "react";
import { Calculator, HelpCircle, HardDrive, Shield } from "lucide-react";

export function CapacityCalculator() {
  const [sampleText, setSampleText] = useState("Hello Nervos CKB! 🚀");
  const [includeTypeScript, setIncludeTypeScript] = useState(false);
  const [customLockArgsSize, setCustomLockArgsSize] = useState(20);

  const dataBytes = new TextEncoder().encode(sampleText).length;
  const capacityBytes = 8;
  const lockCodeHash = 32;
  const lockHashType = 1;
  const lockArgs = customLockArgsSize;
  const lockTotal = lockCodeHash + lockHashType + lockArgs;

  const typeScriptBytes = includeTypeScript ? 32 + 1 + 32 : 0; // code_hash + hash_type + args
  const totalBaseOverhead = capacityBytes + lockTotal + typeScriptBytes;
  const totalRequiredCapacity = totalBaseOverhead + dataBytes;

  return (
    <div className="cream-card rounded-2xl p-6 shadow-sm border border-[#EBE4D8] space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-[#FEF3C7] text-[#B45309]">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-base text-[#262320]">
            Interactive Cell Capacity Calculator
          </h3>
          <p className="text-xs text-[#78716C]">
            Model exact on-chain CKB storage costs (1 Byte = 1 CKB)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Inputs */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#44403C] flex items-center justify-between">
              <span>Sample Payload Text:</span>
              <span className="text-[11px] font-mono text-[#78716C]">
                {dataBytes} Bytes
              </span>
            </label>
            <input
              type="text"
              value={sampleText}
              onChange={(e) => setSampleText(e.target.value)}
              className="w-full cream-input rounded-xl px-3.5 py-2 text-xs font-sans"
              placeholder="Type anything to calculate..."
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-[#44403C] cursor-pointer">
              <input
                type="checkbox"
                checked={includeTypeScript}
                onChange={(e) => setIncludeTypeScript(e.target.checked)}
                className="rounded accent-[#D97706]"
              />
              <span>Include Custom Type Script (+65 Bytes)</span>
            </label>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#44403C] flex items-center justify-between">
              <span>Lock Script Args Length:</span>
              <span className="text-[11px] font-mono text-[#B45309]">
                {customLockArgsSize} Bytes {customLockArgsSize === 20 ? "(Standard SECP256K1)" : "(Extended/Omnilock)"}
              </span>
            </label>
            <input
              type="range"
              min="20"
              max="65"
              value={customLockArgsSize}
              onChange={(e) => setCustomLockArgsSize(parseInt(e.target.value))}
              className="w-full accent-[#D97706]"
            />
          </div>
        </div>

        {/* Breakdown Result */}
        <div className="p-4 rounded-xl cream-card-subtle border border-[#E5DCD0] flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#78716C]">Capacity Field:</span>
              <span className="font-mono text-[#262320]">8 CKB (8 Bytes)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#78716C]">Lock Script (CodeHash + Type + Args):</span>
              <span className="font-mono text-[#262320]">{lockTotal} CKB ({lockTotal} Bytes)</span>
            </div>
            {includeTypeScript && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#78716C]">Type Script Overhead:</span>
                <span className="font-mono text-[#262320]">65 CKB (65 Bytes)</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#78716C]">OutputsData Payload:</span>
              <span className="font-mono text-[#262320]">{dataBytes} CKB ({dataBytes} Bytes)</span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5DCD0] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#262320]">Minimum Total Capacity:</span>
            <span className="text-base font-bold font-mono text-[#B45309]">
              {totalRequiredCapacity} CKB
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
