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
      className="group block bg-white rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-100 p-6 hover:shadow-[0_14px_35px_-6px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all relative overflow-hidden"
    >
      {/* Category, Status & Traffic Light Header */}
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
            {doc.category}
          </span>
          <span className="text-xs font-medium text-slate-400">v{doc.version}.0</span>
        </div>

        <div className="flex items-center gap-2">
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
      <h3 className="text-base font-medium text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 flex items-center justify-between">
        <span>{doc.title}</span>
        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0 ml-2" />
      </h3>

      {/* Summary */}
      <p className="text-xs font-normal text-slate-500 line-clamp-2 leading-relaxed mb-4">
        {doc.summary || "No executive summary provided for this organizational document."}
      </p>

      {/* Compliance & Signature Pill if applicable */}
      {doc.requiresSignoff && (
        <div className="mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <UserCheck className="w-3.5 h-3.5 text-violet-500" />
            <span className="font-medium text-xs">Signatures:</span>
            <span className="text-xs font-medium text-slate-400">
              {signedCount}/{totalSignatures} completed
            </span>
          </div>

          {userSignature?.status === "SIGNED" ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Signed
            </span>
          ) : userSignature?.status === "PENDING" ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-600">
              <Clock className="w-3 h-3 text-violet-500" /> Action Required
            </span>
          ) : null}
        </div>
      )}

      {/* Author & Timestamp footer */}
      <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          {doc.author.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doc.author.avatarUrl}
              alt={doc.author.name}
              className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
              {doc.author.name.charAt(0)}
            </div>
          )}
          <span className="text-slate-700 font-medium text-xs truncate max-w-[130px]">
            {doc.author.name}
          </span>
        </div>
        <span className="text-xs font-medium text-slate-400">{formatDate(doc.updatedAt)}</span>
      </div>
    </Link>
  );
}
