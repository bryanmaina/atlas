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
      textColor: "text-rose-400",
      bgColor: "bg-rose-500/10 border-rose-500/30",
    },
    YELLOW: {
      label: `1 of ${requiredSignatures} Signed`,
      tooltip: "1 signature recorded — Awaiting second distinct validator",
      textColor: "text-amber-300",
      bgColor: "bg-amber-500/10 border-amber-500/30",
    },
    GREEN: {
      label: `Verified (${count}/${requiredSignatures})`,
      tooltip: "Verified by 2 distinct user signatures",
      textColor: "text-emerald-300",
      bgColor: "bg-emerald-500/10 border-emerald-500/30",
    },
  }[activeState];

  const dotSize = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";

  return (
    <div
      title={meta.tooltip}
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border ${meta.bgColor} transition-all ${className}`}
    >
      {/* 3-Lamp Traffic Light Housing */}
      <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-slate-950/80 border border-slate-800 shadow-inner">
        {/* Red Lamp */}
        <span
          className={`rounded-full transition-all duration-300 ${dotSize} ${
            activeState === "RED"
              ? "bg-rose-500 shadow-[0_0_8px_#f43f5e] ring-1 ring-rose-400 animate-pulse"
              : "bg-rose-950/60 opacity-30"
          }`}
        />

        {/* Yellow Lamp */}
        <span
          className={`rounded-full transition-all duration-300 ${dotSize} ${
            activeState === "YELLOW"
              ? "bg-amber-400 shadow-[0_0_8px_#f59e0b] ring-1 ring-amber-300 animate-pulse"
              : "bg-amber-950/60 opacity-30"
          }`}
        />

        {/* Green Lamp */}
        <span
          className={`rounded-full transition-all duration-300 ${dotSize} ${
            activeState === "GREEN"
              ? "bg-emerald-400 shadow-[0_0_8px_#10b981] ring-1 ring-emerald-300 animate-pulse"
              : "bg-emerald-950/60 opacity-30"
          }`}
        />
      </div>

      {showLabel && (
        <span className={`text-[11px] font-semibold tracking-tight ${meta.textColor}`}>
          {meta.label}
        </span>
      )}
    </div>
  );
}
