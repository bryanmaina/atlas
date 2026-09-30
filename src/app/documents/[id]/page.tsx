"use client";

import React, { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Cpu,
  Lock,
  Copy,
  Check,
  Trash2,
} from "lucide-react";
import { useCurrentUser } from "@/components/providers/UserContext";
import { StatusBadge } from "@/components/documents/StatusBadge";
import { TrafficLight } from "@/components/documents/TrafficLight";
import { DocumentLineage } from "@/components/documents/DocumentLineage";
import { SignatureModal } from "@/components/signatures/SignatureModal";
import { VerificationModal } from "@/components/documents/VerificationModal";
import { formatDate, formatDateTime } from "@/lib/utils";

interface DocumentDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string | null;
  category: string;
  tags: string | null;
  status: string;
  version: number;
  requiresSignoff: boolean;
  requiredValidationLevel: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    role: string;
    skills: string;
    department: string | null;
    avatarUrl: string | null;
  };
  lastEditor?: {
    id: string;
    name: string;
    email: string;
    role: string;
    skills: string;
    department: string | null;
    avatarUrl: string | null;
  } | null;
  verification?: {
    trafficLight: "RED" | "YELLOW" | "GREEN";
    signedCount: number;
    requiredSignatures: number;
    isVerified: boolean;
  };
  signatures: Array<{
    id: string;
    status: string;
    validationLevel: string;
    signatureHash: string | null;
    ipAddress: string | null;
    signedAt: string | null;
    comments: string | null;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      skills: string;
      department: string | null;
      avatarUrl: string | null;
    };
  }>;
  _count?: {
    chunks: number;
    signatures: number;
  };
}

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { currentUser } = useCurrentUser();

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOpen, setIsSigningOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fetchDocument = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/documents/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDoc(data.document);
      } else {
        router.push("/documents");
      }
    } catch (err) {
      console.error("Error loading document:", err);
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document and purge its vector index?")) {
      return;
    }
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/documents");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  if (isLoading || !doc) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading document & vector state...</p>
      </div>
    );
  }

  // Find user's signature record
  const userSignature = currentUser
    ? doc.signatures.find((s) => s.user.id === currentUser.id)
    : undefined;
  const isPendingForUser = userSignature?.status === "PENDING";

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Navigation & actions bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/documents"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Documents
        </Link>

        {currentUser?.role === "ADMIN" && (
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Document
          </button>
        )}
      </div>

      {/* Main Grid: Document Viewer + Right Compliance Sidebar */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Document Body */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
            {/* Header info with Traffic Light */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-300">
                  {doc.category}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                  v{doc.version}.0
                </span>
                <StatusBadge status={doc.status} requiresSignoff={doc.requiresSignoff} size="sm" />
              </div>

              <TrafficLight
                state={doc.verification?.trafficLight}
                signaturesCount={
                  doc.verification?.signedCount ??
                  doc.signatures.filter((s) => s.status === "SIGNED").length
                }
                requiredSignatures={2}
              />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
              {doc.title}
            </h1>

            {/* Executive summary banner */}
            {doc.summary && (
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 mb-6 text-xs text-indigo-200 leading-relaxed">
                <span className="font-semibold block mb-1 text-indigo-300 uppercase tracking-wider text-[10px]">
                  Executive Summary
                </span>
                {doc.summary}
              </div>
            )}

            {/* Document Content */}
            <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed space-y-4">
              {doc.content.split("\n\n").map((block, idx) => {
                const trimmed = block.trim();
                if (trimmed.startsWith("## ")) {
                  return (
                    <h2
                      key={idx}
                      className="text-lg font-bold text-white pt-4 pb-1 border-b border-slate-800/80"
                    >
                      {trimmed.replace("## ", "")}
                    </h2>
                  );
                }
                if (trimmed.startsWith("# ")) {
                  return (
                    <h1 key={idx} className="text-xl font-extrabold text-white pt-2">
                      {trimmed.replace("# ", "")}
                    </h1>
                  );
                }
                if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                  return (
                    <ul key={idx} className="list-disc pl-5 space-y-1.5 text-slate-300">
                      {trimmed.split("\n").map((line, li) => (
                        <li key={li}>{line.replace(/^[-*]\s*/, "")}</li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={idx} className="text-slate-300">
                    {trimmed}
                  </p>
                );
              })}
            </div>

            {/* Tags */}
            {doc.tags && (
              <div className="pt-6 mt-6 border-t border-slate-800 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                <span className="font-medium mr-1 text-slate-400">Tags:</span>
                {doc.tags.split(",").map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
                  >
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Document Lineage & Dual Verification Audit Trail */}
          <DocumentLineage
            documentId={doc.id}
            documentTitle={doc.title}
            version={doc.version}
            status={doc.status}
            author={doc.author}
            createdAt={doc.createdAt}
            lastEditor={doc.lastEditor}
            updatedAt={doc.updatedAt}
            signatures={doc.signatures}
            hasUserSigned={Boolean(
              currentUser &&
                doc.signatures.some(
                  (s) => s.user.id === currentUser.id && s.status === "SIGNED"
                )
            )}
            currentUserName={currentUser?.name}
            canSign={Boolean(
              currentUser &&
                !doc.signatures.some(
                  (s) => s.user.id === currentUser.id && s.status === "SIGNED"
                ) &&
                doc.signatures.filter((s) => s.status === "SIGNED").length < 2
            )}
            onTriggerSign={() => setIsVerificationModalOpen(true)}
          />
        </div>

        {/* Right Column: Metadata & Signatures Audit Trail */}
        <div className="space-y-6">
          {/* Action Sign Banner if user has pending signature */}
          {doc.requiresSignoff && isPendingForUser && (
            <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/40 glass-card">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm mb-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                Sign-off Required
              </div>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                As <span className="text-white font-semibold">{currentUser?.name}</span>, your
                digital acknowledgment is required for compliance adherence.
              </p>
              <button
                onClick={() => setIsSigningOpen(true)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                Sign Document Now
              </button>
            </div>
          )}

          {/* User Already Signed Badge */}
          {userSignature?.status === "SIGNED" && (
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 glass-card">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                You Have Signed This Document
              </div>
              <p className="text-[11px] text-slate-400">
                Signed on {formatDate(userSignature.signedAt)} with cryptographic verification.
              </p>
            </div>
          )}

          {/* Document Metadata Card */}
          <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-4 text-xs">
            <h3 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
              Document Metadata
            </h3>

            {/* Author */}
            <div className="flex items-center gap-3">
              {doc.author.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={doc.author.avatarUrl}
                  alt={doc.author.name}
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                  {doc.author.name.charAt(0)}
                </div>
              )}
              <div>
                <div className="font-semibold text-slate-200">{doc.author.name}</div>
                <div className="text-[11px] text-slate-400">
                  {doc.author.department} • {doc.author.role}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  <span className="text-slate-300 font-medium">Skills:</span> {doc.author.skills}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-2 text-slate-400 text-[11px]">
              <div className="flex items-center justify-between">
                <span>Published:</span>
                <span className="text-slate-200 font-medium">{formatDate(doc.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Updated:</span>
                <span className="text-slate-200 font-medium">{formatDate(doc.updatedAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Required Validation:</span>
                <span className="text-amber-300 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  {doc.requiredValidationLevel}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Vector Chunks:</span>
                <span className="text-indigo-400 font-mono font-medium flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  {doc._count?.chunks || 5} chunks indexed
                </span>
              </div>
            </div>
          </div>

          {/* Compliance & Signatures Audit Log Card */}
          <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                Signature Audit Log
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {doc.signatures.filter((s) => s.status === "SIGNED").length}/
                {doc.signatures.length}
              </span>
            </div>

            {doc.signatures.length === 0 ? (
              <p className="text-xs text-slate-400">
                No signatures required for this informational specification.
              </p>
            ) : (
              <div className="space-y-2.5">
                {doc.signatures.map((sig) => {
                  const isSigned = sig.status === "SIGNED";
                  return (
                    <div
                      key={sig.id}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          {isSigned ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span>{sig.user.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                            {sig.validationLevel}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.2 rounded-full font-medium ${
                              isSigned
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {isSigned ? "Verified" : "Pending"}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400">
                        {sig.user.department} • {sig.user.role}
                      </div>

                      <div className="text-[10px] text-slate-400 line-clamp-1">
                        <strong className="text-slate-300">Skills:</strong> {sig.user.skills}
                      </div>

                      {isSigned && (
                        <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
                          <div className="flex items-center justify-between">
                            <span>Signed on:</span>
                            <span className="text-slate-300 font-mono">
                              {formatDateTime(sig.signedAt)}
                            </span>
                          </div>

                          {sig.signatureHash && (
                            <div className="mt-1">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-indigo-400">SHA-256 Digest:</span>
                                <button
                                  onClick={() => handleCopyHash(sig.signatureHash!)}
                                  className="text-slate-400 hover:text-white flex items-center gap-1"
                                >
                                  {copiedHash === sig.signatureHash ? (
                                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-2.5 h-2.5" />
                                  )}
                                  {copiedHash === sig.signatureHash ? "Copied" : "Copy"}
                                </button>
                              </div>
                              <div className="p-1 rounded bg-black/60 font-mono text-[9px] text-slate-400 truncate">
                                {sig.signatureHash}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legacy Signature Modal */}
      {doc.requiresSignoff && userSignature && currentUser && (
        <SignatureModal
          isOpen={isSigningOpen}
          onClose={() => setIsSigningOpen(false)}
          documentId={doc.id}
          documentTitle={doc.title}
          documentVersion={doc.version}
          signatureId={userSignature.id}
          user={currentUser}
          onSuccess={() => {
            fetchDocument();
          }}
        />
      )}

      {/* Information Verification Modal (Dual Distinct Signatures) */}
      {isVerificationModalOpen && (
        <VerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
          documentId={doc.id}
          documentTitle={doc.title}
          documentVersion={doc.version}
          currentSignaturesCount={
            doc.signatures.filter((s) => s.status === "SIGNED").length
          }
          onSuccess={() => {
            fetchDocument();
          }}
        />
      )}
    </div>
  );
}
