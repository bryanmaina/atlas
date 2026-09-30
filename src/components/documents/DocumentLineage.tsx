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
        return "bg-violet-50 text-violet-600 border border-violet-200/60";
      case "VALIDATOR":
        return "bg-cyan-50 text-cyan-700 border border-cyan-200/60";
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200/60";
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8 relative overflow-hidden">
      {/* Header with Traffic Light */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Document Lineage &amp; Verification Lifecycle</span>
          </div>
          <h2 className="text-2xl font-medium text-slate-800">
            Provenance &amp; Dual-Signature Lineage
          </h2>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Full cryptographic audit trail: author origin, editorial revisions, and required dual-user validation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <TrafficLight signaturesCount={distinctSignedCount} requiredSignatures={2} />
        </div>
      </div>

      {/* Stepped Timeline */}
      <div className="space-y-6">
        {/* Step 1: Created */}
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center shadow-sm">
              <FilePlus className="w-5 h-5" />
            </div>
            <div className="w-0.5 h-full min-h-[50px] bg-slate-200 my-1" />
          </div>

          <div className="flex-1 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-blue-600">
                  Step 1: Authored &amp; Created
                </span>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  v1.0 (Draft)
                </span>
              </div>
              <span className="text-xs font-medium text-slate-400">{formatDateTime(createdAt)}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {author.avatarUrl ? (
                  <Image
                    src={author.avatarUrl}
                    alt={author.name}
                    width={36}
                    height={36}
                    unoptimized
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {author.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{author.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getRoleBadgeStyle(
                        author.role
                      )}`}
                    >
                      {author.role}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-400">
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
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 border border-cyan-200/60 text-cyan-600 flex items-center justify-center shadow-sm">
              <FileEdit className="w-5 h-5" />
            </div>
            <div className="w-0.5 h-full min-h-[50px] bg-slate-200 my-1" />
          </div>

          <div className="flex-1 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-cyan-600">
                  Step 2: Editorial Revision
                </span>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  v{version}.0
                </span>
              </div>
              <span className="text-xs font-medium text-slate-400">{formatDateTime(updatedAt)}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
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
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-xs">
                        {lastEditor.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800">
                          {lastEditor.name}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getRoleBadgeStyle(
                            lastEditor.role
                          )}`}
                        >
                          {lastEditor.role}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-slate-400">
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
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                        {author.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800">{author.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-medium">
                          Author &amp; Maintainer
                        </span>
                      </div>
                      <span className="text-xs font-medium text-slate-400">
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
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm transition-all ${
                isVerified
                  ? "bg-emerald-50 border border-emerald-200/60 text-emerald-600"
                  : distinctSignedCount === 1
                  ? "bg-violet-50 border border-violet-200/60 text-violet-600"
                  : "bg-blue-50 border border-blue-200/60 text-blue-600"
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium uppercase tracking-wider ${
                    isVerified
                      ? "text-emerald-600"
                      : distinctSignedCount === 1
                      ? "text-violet-600"
                      : "text-blue-600"
                  }`}
                >
                  Step 3: Dual-User Verification Sign-Off
                </span>
                <span
                  className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border ${
                    isVerified
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-violet-50 border-violet-200 text-violet-700"
                  }`}
                >
                  {distinctSignedCount}/2 Distinct Signatures
                </span>
              </div>

              {isVerified ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Status: Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600">
                  <Clock className="w-4 h-4 text-violet-500" />
                  Status: Draft (Pending 2nd Signature)
                </span>
              )}
            </div>

            {/* Validator 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-xs font-medium text-slate-500 mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      signedSignatures[0] ? "text-emerald-500" : "text-slate-400"
                    }`}
                  />
                  <span>Validator 1 of 2</span>
                </span>
                {signedSignatures[0]?.signedAt && (
                  <span className="text-xs font-medium text-slate-400">
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
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {signedSignatures[0].user.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-slate-800">
                            {signedSignatures[0].user.name}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getRoleBadgeStyle(
                              signedSignatures[0].user.role
                            )}`}
                          >
                            {signedSignatures[0].user.role}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-slate-400">
                          {signedSignatures[0].comments || "Verified and approved."}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                      {signedSignatures[0].validationLevel}
                    </span>
                  </div>

                  {signedSignatures[0].signatureHash && (
                    <div className="mt-2 flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-600">
                      <span className="truncate max-w-[280px]">
                        SHA-256: {signedSignatures[0].signatureHash.substring(0, 32)}...
                      </span>
                      <button
                        onClick={() => handleCopy(signedSignatures[0].signatureHash!)}
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                        title="Copy cryptographic proof"
                      >
                        {copiedHash === signedSignatures[0].signatureHash ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-white border border-dashed border-slate-200 text-xs text-slate-400 italic">
                  Awaiting first validation signature.
                </div>
              )}
            </div>

            {/* Validator 2 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-xs font-medium text-slate-500 mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      signedSignatures[1] ? "text-emerald-500" : "text-slate-400"
                    }`}
                  />
                  <span>Validator 2 of 2 (Distinct User)</span>
                </span>
                {signedSignatures[1]?.signedAt && (
                  <span className="text-xs font-medium text-slate-400">
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
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {signedSignatures[1].user.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-slate-800">
                            {signedSignatures[1].user.name}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getRoleBadgeStyle(
                              signedSignatures[1].user.role
                            )}`}
                          >
                            {signedSignatures[1].user.role}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-slate-400">
                          {signedSignatures[1].comments || "Dual verification completed."}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                      {signedSignatures[1].validationLevel}
                    </span>
                  </div>

                  {signedSignatures[1].signatureHash && (
                    <div className="mt-2 flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-600">
                      <span className="truncate max-w-[280px]">
                        SHA-256: {signedSignatures[1].signatureHash.substring(0, 32)}...
                      </span>
                      <button
                        onClick={() => handleCopy(signedSignatures[1].signatureHash!)}
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                        title="Copy cryptographic proof"
                      >
                        {copiedHash === signedSignatures[1].signatureHash ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-white border border-dashed border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-violet-500 shrink-0" />
                    <span>
                      Awaiting second distinct validator signature to change document status to{" "}
                      <strong className="text-emerald-600 font-medium">&lsquo;Verified&rsquo;</strong>.
                    </span>
                  </div>

                  {/* Active user status warning or execution CTA */}
                  {hasUserSigned ? (
                    <div className="p-3.5 rounded-xl bg-violet-50 border border-violet-200/60 text-violet-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-violet-500 shrink-0" />
                      <span>
                        You have already signed as <strong>{currentUserName}</strong>. A different, distinct team member must provide the second signature.
                      </span>
                    </div>
                  ) : canSign && onTriggerSign ? (
                    <button
                      type="button"
                      onClick={onTriggerSign}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-white font-medium text-xs shadow-[0_4px_15px_rgba(52,211,153,0.3)] hover:opacity-95 transition-all"
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
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-emerald-800 block">
                      Information Verification Complete
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Two distinct signatures recorded. Status elevated from &lsquo;Draft&rsquo; to &lsquo;Verified&rsquo;.
                    </span>
                  </div>
                </div>
                <Users className="w-5 h-5 text-emerald-500 opacity-60" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
