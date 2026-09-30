import React from "react";
import { CheckCircle2, Clock, FileEdit, ShieldAlert } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  requiresSignoff?: boolean;
}

export function StatusBadge({ status, size = "md", requiresSignoff }: StatusBadgeProps) {
  const isSm = size === "sm";
  const sizeClasses = isSm ? "px-2.5 py-0.5 text-[11px]" : "px-3.5 py-1 text-xs";

  if (requiresSignoff || status === "REQUIRES_SIGNATURE") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 text-white shadow-[0_4px_15px_rgba(167,139,250,0.3)] ${sizeClasses}`}
      >
        <ShieldAlert className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
        Requires Sign-off
      </span>
    );
  }

  switch (status.toUpperCase()) {
    case "VERIFIED":
    case "PUBLISHED":
    case "APPROVED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-white shadow-[0_4px_15px_rgba(52,211,153,0.3)] ${sizeClasses}`}
        >
          <CheckCircle2 className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
          Verified
        </span>
      );
    case "SIGNED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-white shadow-[0_4px_15px_rgba(52,211,153,0.3)] ${sizeClasses}`}
        >
          <CheckCircle2 className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
          Signed
        </span>
      );
    case "IN_REVIEW":
    case "PENDING":
    case "PENDING_REVIEW":
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 text-white shadow-[0_4px_15px_rgba(167,139,250,0.3)] ${sizeClasses}`}
        >
          <Clock className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
          Pending Review
        </span>
      );
    case "DRAFT":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-gradient-to-r from-blue-300 to-cyan-300 text-slate-800 shadow-[0_4px_15px_rgba(147,197,253,0.4)] ${sizeClasses}`}
        >
          <FileEdit className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
          Draft
        </span>
      );
  }
}
