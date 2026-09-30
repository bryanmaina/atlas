"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  FilePlus,
  FileEdit,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Lock,
  Sparkles,
  AlertCircle,
  Users,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { TrafficLight } from "./TrafficLight";

export interface LineageUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  department?: string | null;
}

export interface LineageSignature {
  id: string;
  user: LineageUser;
  signedAt: string | Date | null;
  signatureHash: string | null;
  validationLevel: string;
  comments?: string | null;
}

interface DocumentLineageProps {
  documentId: string;
  documentTitle: string;
  version: number;
  status: string;
  author: LineageUser;
  createdAt: string | Date;
  lastEditor?: LineageUser | null;
  updatedAt: string | Date;
  signatures: LineageSignature[];
  onTriggerSign?: () => void;
  canSign?: boolean;
  hasUserSigned?: boolean;
  currentUserName?: string;
}

export function DocumentLineage({
  version,
  status,
  author,
  createdAt,
  lastEditor,
  updatedAt,
  signatures,
  onTriggerSign,
  canSign = true,
  hasUserSigned = false,
  currentUserName,
}: DocumentLineageProps) {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const signedSignatures = signatures.filter((s) => s.signedAt !== null);
  const distinctSignedCount = signedSignatures.length;
  const isVerified = status === "VERIFIED" || distinctSignedCount >= 2;

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role?.toUpperCase()) {
      case "ADMIN":
        return "bg-purple-500/15 border-purple-500/30 text-purple-300";
      case "VALIDATOR":
        return "bg-cyan-500/15 border-cyan-500/30 text-cyan-300";
      default:
        return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
    }
  };

  return (
    <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-indigo-500/20 shadow-2xl relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-indigo-600/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header with Traffic Light */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Document Lineage & Verification Lifecycle</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Provenance & Dual-Signature Lineage
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Full cryptographic audit trail: author origin, editorial revisions, and required dual-user validation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <TrafficLight signaturesCount={distinctSignedCount} requiredSignatures={2} />
        </div>
      </div>

      {/* Stepped Timeline */}
      <div className="relative z-10 space-y-6">
        {/* Step 1: Created */}
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <FilePlus className="w-5 h-5" />
            </div>
            <div className="w-0.5 h-full min-h-[50px] bg-gradient-to-b from-indigo-500/40 to-slate-800 my-1" />
          </div>

          <div className="flex-1 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Step 1: Authored & Created
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-800/40 text-indigo-300">
                  v1.0 (Draft)
                </span>
              </div>
              <span className="text-xs text-slate-400">{formatDateTime(createdAt)}</span>
            </div>

            <div className="p-3.5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {author.avatarUrl ? (
                  <Image
                    src={author.avatarUrl}
                    alt={author.name}
                    width={36}
                    height={36}
                    unoptimized
                    className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                    {author.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{author.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getRoleBadgeStyle(
                        author.role
                      )}`}
                    >
                      {author.role}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Created initial policy document and architecture standards
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Edited / Revised */}
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <FileEdit className="w-5 h-5" />
            </div>
            <div className="w-0.5 h-full min-h-[50px] bg-gradient-to-b from-cyan-500/40 to-slate-800 my-1" />
          </div>

          <div className="flex-1 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Step 2: Editorial Revision
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-800/40 text-cyan-300">
                  v{version}.0
                </span>
              </div>
              <span className="text-xs text-slate-400">{formatDateTime(updatedAt)}</span>
            </div>

            <div className="p-3.5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {lastEditor ? (
                  <>
                    {lastEditor.avatarUrl ? (
                      <Image
                        src={lastEditor.avatarUrl}
                        alt={lastEditor.name}
                        width={36}
                        height={36}
                        unoptimized
                        className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-cyan-600 flex items-center justify-center font-bold text-white text-xs">
                        {lastEditor.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {lastEditor.name}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getRoleBadgeStyle(
                            lastEditor.role
                          )}`}
                        >
                          {lastEditor.role}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        Updated specifications, security controls, and operational guidelines
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    {author.avatarUrl ? (
                      <Image
                        src={author.avatarUrl}
                        alt={author.name}
                        width={36}
                        height={36}
                        unoptimized
                        className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center font-bold text-white text-xs">
                        {author.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{author.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
                          Author & Maintainer
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        Maintained baseline specifications in v1.0
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Dual Validation & Verification */}
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all ${
                isVerified
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-emerald-500/20"
                  : distinctSignedCount === 1
                  ? "bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-amber-500/20"
                  : "bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-rose-500/20"
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isVerified
                      ? "text-emerald-400"
                      : distinctSignedCount === 1
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}
                >
                  Step 3: Dual-User Verification Sign-Off
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                    isVerified
                      ? "bg-emerald-950/60 border-emerald-800/40 text-emerald-300"
                      : "bg-amber-950/60 border-amber-800/40 text-amber-300"
                  }`}
                >
                  {distinctSignedCount}/2 Distinct Signatures
                </span>
              </div>

              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Status: Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                  <Clock className="w-4 h-4" />
                  Status: Draft (Unverified)
                </span>
              )}
            </div>

            {/* Render First Signature */}
            <div className="p-4 rounded-2xl glass-card border border-slate-800">
              <div className="text-xs font-semibold text-slate-400 mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      signedSignatures[0] ? "text-emerald-400" : "text-slate-600"
                    }`}
                  />
                  <span>Validator 1 of 2</span>
                </span>
                {signedSignatures[0]?.signedAt && (
                  <span className="text-[11px] font-normal text-slate-400">
                    {formatDateTime(signedSignatures[0].signedAt)}
                  </span>
                )}
              </div>

              {signedSignatures[0] ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {signedSignatures[0].user.avatarUrl ? (
                        <Image
                          src={signedSignatures[0].user.avatarUrl}
                          alt={signedSignatures[0].user.name}
                          width={32}
                          height={32}
                          unoptimized
                          className="w-8 h-8 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                          {signedSignatures[0].user.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-white">
                            {signedSignatures[0].user.name}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md border font-semibold ${getRoleBadgeStyle(
                              signedSignatures[0].user.role
                            )}`}
                          >
                            {signedSignatures[0].user.role}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {signedSignatures[0].comments || "Verified and approved."}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-semibold">
                      {signedSignatures[0].validationLevel}
                    </span>
                  </div>

                  {signedSignatures[0].signatureHash && (
                    <div className="mt-2 flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400">
                      <span className="truncate max-w-[280px]">
                        SHA-256: {signedSignatures[0].signatureHash.substring(0, 32)}...
                      </span>
                      <button
                        onClick={() => handleCopy(signedSignatures[0].signatureHash!)}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Copy cryptographic proof"
                      >
                        {copiedHash === signedSignatures[0].signatureHash ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-dashed border-slate-800 text-xs text-slate-400 italic">
                  Awaiting first validation signature.
                </div>
              )}
            </div>

            {/* Render Second Signature */}
            <div className="p-4 rounded-2xl glass-card border border-slate-800">
              <div className="text-xs font-semibold text-slate-400 mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      signedSignatures[1] ? "text-emerald-400" : "text-slate-600"
                    }`}
                  />
                  <span>Validator 2 of 2 (Distinct User)</span>
                </span>
                {signedSignatures[1]?.signedAt && (
                  <span className="text-[11px] font-normal text-slate-400">
                    {formatDateTime(signedSignatures[1].signedAt)}
                  </span>
                )}
              </div>

              {signedSignatures[1] ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {signedSignatures[1].user.avatarUrl ? (
                        <Image
                          src={signedSignatures[1].user.avatarUrl}
                          alt={signedSignatures[1].user.name}
                          width={32}
                          height={32}
                          unoptimized
                          className="w-8 h-8 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                          {signedSignatures[1].user.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-white">
                            {signedSignatures[1].user.name}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md border font-semibold ${getRoleBadgeStyle(
                              signedSignatures[1].user.role
                            )}`}
                          >
                            {signedSignatures[1].user.role}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {signedSignatures[1].comments || "Dual verification completed."}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
                      {signedSignatures[1].validationLevel}
                    </span>
                  </div>

                  {signedSignatures[1].signatureHash && (
                    <div className="mt-2 flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400">
                      <span className="truncate max-w-[280px]">
                        SHA-256: {signedSignatures[1].signatureHash.substring(0, 32)}...
                      </span>
                      <button
                        onClick={() => handleCopy(signedSignatures[1].signatureHash!)}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Copy cryptographic proof"
                      >
                        {copiedHash === signedSignatures[1].signatureHash ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-dashed border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Awaiting second distinct validator signature to change document status to{" "}
                      <strong className="text-emerald-400 font-semibold">&lsquo;Verified&rsquo;</strong>.
                    </span>
                  </div>

                  {/* Active user status warning or execution CTA */}
                  {hasUserSigned ? (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        You have already signed as <strong>{currentUserName}</strong>. A different, distinct team member must provide the second signature.
                      </span>
                    </div>
                  ) : canSign && onTriggerSign ? (
                    <button
                      type="button"
                      onClick={onTriggerSign}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.01]"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Execute Verification Signature ({distinctSignedCount + 1} of 2)</span>
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            {/* Official Verification Seal */}
            {isVerified && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-indigo-950/40 border border-emerald-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-300 block">
                      Information Verification Complete
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Two distinct signatures recorded. Status elevated from &lsquo;Draft&rsquo; to &lsquo;Verified&rsquo;.
                    </span>
                  </div>
                </div>
                <Users className="w-5 h-5 text-emerald-400 opacity-60" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
