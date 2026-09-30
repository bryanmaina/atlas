import React from "react";
import { CheckCircle2, Clock, FileEdit, ShieldAlert } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  requiresSignoff?: boolean;
}

export function StatusBadge({ status, size = "md", requiresSignoff }: StatusBadgeProps) {
  const isSm = size === "sm";

  if (requiresSignoff || status === "REQUIRES_SIGNATURE") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 ${
          isSm ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
        }`}
      >
        <ShieldAlert className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
        Requires Sign-off
      </span>
    );
  }

  switch (status.toUpperCase()) {
    case "PUBLISHED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 ${
            isSm ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
          }`}
        >
          <CheckCircle2 className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
          Published
        </span>
      );
    case "SIGNED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 ${
            isSm ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
          }`}
        >
          <CheckCircle2 className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
          Executed / Signed
        </span>
      );
    case "IN_REVIEW":
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-300 ${
            isSm ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
          }`}
        >
          <Clock className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
          In Review
        </span>
      );
    case "DRAFT":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full border border-slate-700 bg-slate-800/60 text-slate-300 ${
            isSm ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
          }`}
        >
          <FileEdit className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
          Draft
        </span>
      );
  }
}
