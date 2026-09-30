"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock, UserCheck } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { TrafficLight } from "./TrafficLight";
import { formatDate } from "@/lib/utils";

export interface DocumentCardData {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  category: string;
  status: string;
  version: number;
  requiresSignoff: boolean;
  updatedAt: string;
  author: {
    name: string;
    avatarUrl: string | null;
    role: string;
  };
  lastEditor?: {
    name: string;
    avatarUrl: string | null;
    role: string;
  } | null;
  signatures?: Array<{
    id: string;
    status: string;
    userId: string;
  }>;
  verification?: {
    trafficLight: "RED" | "YELLOW" | "GREEN";
    signedCount: number;
    requiredSignatures: number;
    isVerified: boolean;
  };
}

interface DocumentCardProps {
  doc: DocumentCardData;
  currentUserId?: string;
}

export function DocumentCard({ doc, currentUserId }: DocumentCardProps) {
  const totalSignatures = doc.signatures?.length || 0;
  const signedCount =
    doc.verification?.signedCount ??
    (doc.signatures?.filter((s) => s.status === "SIGNED").length || 0);
  const userSignature = currentUserId
    ? doc.signatures?.find((s) => s.userId === currentUserId)
    : undefined;

  const trafficLightState =
    doc.verification?.trafficLight ??
    (doc.status === "VERIFIED" || signedCount >= 2
      ? "GREEN"
      : signedCount === 1
      ? "YELLOW"
      : "RED");

  return (
    <Link
      href={`/documents/${doc.id}`}
      className="group block p-5 rounded-2xl glass-card relative overflow-hidden"
    >
      {/* Category, Status & Traffic Light Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-300">
            {doc.category}
          </span>
          <span className="text-[11px] font-mono text-slate-400">v{doc.version}.0</span>
        </div>

        <div className="flex items-center gap-1.5">
          <TrafficLight
            state={trafficLightState}
            signaturesCount={signedCount}
            requiredSignatures={2}
            size="sm"
          />
          <StatusBadge status={doc.status} requiresSignoff={doc.requiresSignoff} size="sm" />
        </div>
      </div>

      {/* Document Title */}
      <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2 mb-2 flex items-center justify-between">
        <span>{doc.title}</span>
        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0 ml-2" />
      </h3>

      {/* Summary */}
      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4">
        {doc.summary || "No executive summary provided for this organizational document."}
      </p>

      {/* Compliance & Signature Pill if applicable */}
      {doc.requiresSignoff && (
        <div className="mb-4 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium text-[11px]">Signatures:</span>
            <span className="text-[11px] font-mono text-slate-400">
              {signedCount}/{totalSignatures} completed
            </span>
          </div>

          {userSignature?.status === "SIGNED" ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> Signed
            </span>
          ) : userSignature?.status === "PENDING" ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400">
              <Clock className="w-3 h-3" /> Action Required
            </span>
          ) : null}
        </div>
      )}

      {/* Author & Timestamp footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          {doc.author.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doc.author.avatarUrl}
              alt={doc.author.name}
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-300">
              {doc.author.name.charAt(0)}
            </div>
          )}
          <span className="text-slate-300 font-medium truncate max-w-[120px]">
            {doc.author.name}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">{formatDate(doc.updatedAt)}</span>
      </div>
    </Link>
  );
}
