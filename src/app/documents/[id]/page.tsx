"use client";

import React, { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Trash2,
} from "lucide-react";
import { useCurrentUser } from "@/components/providers/UserContext";
import { StatusBadge } from "@/components/documents/StatusBadge";
import { TrafficLight } from "@/components/documents/TrafficLight";
import { DocumentLineage } from "@/components/documents/DocumentLineage";
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
}

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { currentUser, authFetch } = useCurrentUser();

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifyingOpen, setIsVerifyingOpen] = useState(false);

  const fetchDocument = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/documents/${resolvedParams.id}`);
      if (!res.ok) {
        throw new Error("Failed to load document.");
      }
      const data = await res.json();
      setDoc(data.document);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading document.");
    } finally {
      setIsLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await authFetch(`/api/documents/${resolvedParams.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/documents");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-slate-200/60 rounded-full animate-pulse" />
        <div className="h-96 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm animate-pulse" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="py-16 text-center bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        <h3 className="text-base font-medium text-rose-600 mb-2">Document Not Found</h3>
        <p className="text-xs text-slate-400 mb-6">{error || "Could not retrieve document."}</p>
        <Link
          href="/documents"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-800 text-white text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Documents</span>
        </Link>
      </div>
    );
  }

  const signedSignatures = doc.signatures.filter((s) => s.status === "SIGNED");
  const distinctSignedCount =
    doc.verification?.signedCount ?? signedSignatures.length;
  const isVerified = doc.status === "VERIFIED" || distinctSignedCount >= 2;
  const hasUserSigned = currentUser
    ? signedSignatures.some((s) => s.user.id === currentUser.id)
    : false;

  return (
    <div className="space-y-6">
      {/* Back button & Action controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/documents"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Documents</span>
        </Link>

        <div className="flex items-center gap-2">
          {!isVerified && !hasUserSigned && (
            <button
              onClick={() => setIsVerifyingOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-400 to-teal-400 text-white shadow-[0_4px_15px_rgba(52,211,153,0.3)] hover:opacity-95 transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Verify &amp; Sign Document</span>
            </button>
          )}

          {currentUser?.role === "ADMIN" && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete Document (Admin Only)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Document Viewer + Right Compliance Sidebar */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Document Body */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8">
            {/* Header info with Traffic Light */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                  {doc.category}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  v{doc.version}.0
                </span>
                <StatusBadge status={doc.status} requiresSignoff={doc.requiresSignoff} size="sm" />
              </div>

              <TrafficLight
                state={doc.verification?.trafficLight}
                signaturesCount={distinctSignedCount}
                requiredSignatures={2}
              />
            </div>

            <h1 className="text-2xl sm:text-3xl font-medium text-slate-800 tracking-tight mb-4">
              {doc.title}
            </h1>

            {/* Executive summary banner */}
            {doc.summary && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-6 text-xs text-slate-600 leading-relaxed">
                <span className="font-medium block mb-1 text-slate-400 uppercase tracking-wider text-[10px]">
                  Executive Summary
                </span>
                {doc.summary}
              </div>
            )}

            {/* Document Content */}
            <div className="text-slate-700 text-sm leading-relaxed space-y-4">
              {doc.content.split("\n\n").map((block, idx) => {
                const trimmed = block.trim();
                if (trimmed.startsWith("## ")) {
                  return (
                    <h2
                      key={idx}
                      className="text-lg font-medium text-slate-800 pt-4 pb-1 border-b border-slate-100"
                    >
                      {trimmed.replace("## ", "")}
                    </h2>
                  );
                }
                if (trimmed.startsWith("# ")) {
                  return (
                    <h1 key={idx} className="text-xl font-medium text-slate-800 pt-2">
                      {trimmed.replace("# ", "")}
                    </h1>
                  );
                }
                if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                  return (
                    <ul key={idx} className="list-disc pl-5 space-y-1 text-slate-600">
                      {trimmed.split("\n").map((line, li) => (
                        <li key={li}>{line.replace(/^[-*]\s*/, "")}</li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={idx} className="text-slate-600">
                    {trimmed}
                  </p>
                );
              })}
            </div>

            {/* Tags */}
            {doc.tags && (
              <div className="pt-6 mt-6 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                <span className="font-medium mr-1 text-slate-400">Tags:</span>
                {doc.tags.split(",").map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-[11px]"
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
            onTriggerSign={() => setIsVerifyingOpen(true)}
            canSign={!isVerified && !hasUserSigned}
            hasUserSigned={hasUserSigned}
            currentUserName={currentUser?.name}
          />
        </div>

        {/* Right Column: Metadata & Cryptographic Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-100 p-6 space-y-4">
            <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Governance &amp; Metadata</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-100">
                <span>Verification State:</span>
                <TrafficLight
                  state={doc.verification?.trafficLight}
                  signaturesCount={distinctSignedCount}
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-100">
                <span>Distinct Signatures:</span>
                <span className="font-medium text-slate-800">
                  {distinctSignedCount} of 2 required
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-100">
                <span>Creation Date:</span>
                <span className="font-medium text-slate-800">
                  {formatDate(doc.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-100">
                <span>Last Revised:</span>
                <span className="font-medium text-slate-800">
                  {formatDateTime(doc.updatedAt)}
                </span>
              </div>
            </div>

            {/* Author card */}
            <div className="pt-3 border-t border-slate-100">
              <p className="text-[11px] font-medium text-slate-400 mb-2">Primary Author</p>
              <div className="flex items-center gap-3">
                {doc.author.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={doc.author.avatarUrl}
                    alt={doc.author.name}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {doc.author.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-medium text-slate-800">{doc.author.name}</h4>
                  <p className="text-[11px] text-slate-400">{doc.author.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <VerificationModal
        isOpen={isVerifyingOpen}
        onClose={() => setIsVerifyingOpen(false)}
        documentId={doc.id}
        documentTitle={doc.title}
        documentVersion={doc.version}
        currentSignaturesCount={distinctSignedCount}
        onSuccess={() => fetchDocument()}
      />
    </div>
  );
}
