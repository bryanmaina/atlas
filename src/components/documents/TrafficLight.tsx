"use client";

import React from "react";

export type TrafficLightState = "RED" | "YELLOW" | "GREEN";

interface TrafficLightProps {
  state?: TrafficLightState;
  signaturesCount?: number;
  requiredSignatures?: number;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function TrafficLight({
  state,
  signaturesCount,
  requiredSignatures = 2,
  showLabel = true,
  size = "md",
  className = "",
}: TrafficLightProps) {
  // Derive state if not explicitly provided
  const activeState: TrafficLightState =
    state ??
    (signaturesCount !== undefined
      ? signaturesCount >= requiredSignatures
        ? "GREEN"
        : signaturesCount === 1
        ? "YELLOW"
        : "RED"
      : "RED");

  const count = signaturesCount ?? (activeState === "GREEN" ? 2 : activeState === "YELLOW" ? 1 : 0);

  const meta = {
    RED: {
      label: `Unverified (${count}/${requiredSignatures})`,
      tooltip: "Requires 2 distinct user signatures to verify",
      badgeClass: "bg-gradient-to-r from-blue-300 to-cyan-300 text-slate-800 shadow-[0_4px_15px_rgba(147,197,253,0.4)]",
    },
    YELLOW: {
      label: `1 of ${requiredSignatures} Signed`,
      tooltip: "1 signature recorded — Awaiting second distinct validator",
      badgeClass: "bg-gradient-to-r from-violet-400 to-fuchsia-400 text-white shadow-[0_4px_15px_rgba(167,139,250,0.3)]",
    },
    GREEN: {
      label: `Verified (${count}/${requiredSignatures})`,
      tooltip: "Verified by 2 distinct user signatures",
      badgeClass: "bg-gradient-to-r from-emerald-400 to-teal-400 text-white shadow-[0_4px_15px_rgba(52,211,153,0.3)]",
    },
  }[activeState];

  const dotSize = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";

  return (
    <div
      title={meta.tooltip}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${meta.badgeClass} transition-all ${className}`}
    >
      {/* 3-Lamp Traffic Light Housing */}
      <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-white/40 border border-white/60 shadow-inner">
        {/* Red Lamp */}
        <span
          className={`rounded-full transition-all duration-300 ${dotSize} ${
            activeState === "RED"
              ? "bg-rose-500 shadow-[0_0_8px_#f43f5e] ring-1 ring-white"
              : "bg-slate-400/40 opacity-40"
          }`}
        />

        {/* Yellow Lamp */}
        <span
          className={`rounded-full transition-all duration-300 ${dotSize} ${
            activeState === "YELLOW"
              ? "bg-amber-300 shadow-[0_0_8px_#f59e0b] ring-1 ring-white"
              : "bg-slate-400/40 opacity-40"
          }`}
        />

        {/* Green Lamp */}
        <span
          className={`rounded-full transition-all duration-300 ${dotSize} ${
            activeState === "GREEN"
              ? "bg-emerald-300 shadow-[0_0_8px_#10b981] ring-1 ring-white"
              : "bg-slate-400/40 opacity-40"
          }`}
        />
      </div>

      {showLabel && (
        <span className="text-[11px] font-semibold tracking-tight">
          {meta.label}
        </span>
      )}
    </div>
  );
}
