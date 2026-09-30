"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ExternalLink,
  FileText,
} from "lucide-react";
import { useCurrentUser } from "@/components/providers/UserContext";
import { SignatureModal } from "@/components/signatures/SignatureModal";
import { formatDateTime } from "@/lib/utils";

interface AuditSignature {
  id: string;
  status: string;
  validationLevel: string;
  signatureHash: string | null;
  ipAddress: string | null;
  signedAt: string | null;
  comments: string | null;
  document: {
    id: string;
    title: string;
    category: string;
    version: number;
    status: string;
    requiredValidationLevel?: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    skills: string;
    department: string | null;
    avatarUrl: string | null;
  };
}

interface Metrics {
  total: number;
  signed: number;
  pending: number;
  complianceRate: number;
}

export default function SignaturesCompliancePage() {
  const { currentUser } = useCurrentUser();
  const [signatures, setSignatures] = useState<AuditSignature[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    total: 0,
    signed: 0,
    pending: 0,
    complianceRate: 100,
  });
  const [filterStatus, setFilterStatus] = useState<"ALL" | "SIGNED" | "PENDING">("ALL");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSigningItem, setActiveSigningItem] = useState<AuditSignature | null>(null);

  const fetchSignatures = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/signatures");
      if (res.ok) {
        const data = await res.json();
        setSignatures(data.signatures || []);
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      }
    } catch (err) {
      console.error("Error fetching signatures:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSignatures();
  }, []);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredSignatures = signatures.filter((sig) => {
    if (filterStatus === "SIGNED") return sig.status === "SIGNED";
    if (filterStatus === "PENDING") return sig.status === "PENDING";
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white">Compliance & Signatures</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              SHA-256 Audit Trail
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident legal acknowledgment records for regulatory compliance and audit readiness
          </p>
        </div>
      </div>

      {/* Compliance Overview Banner */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 shadow-xl grid md:grid-cols-4 gap-6 items-center">
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
              Organizational Policy Adherence
            </span>
            <span className="font-bold text-emerald-400 font-mono text-sm">
              {metrics.complianceRate}% Completed
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${metrics.complianceRate}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400">
            {metrics.signed} of {metrics.total} required signatures verified across all active
            departments.
          </p>
        </div>

        {/* Counter cards */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Verified Sign-offs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{metrics.signed}</div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">Cryptographically logged</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Pending Signatures</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{metrics.pending}</div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">Awaiting team acknowledgment</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterStatus === "ALL"
                ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All Logs ({signatures.length})
          </button>
          <button
            onClick={() => setFilterStatus("SIGNED")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterStatus === "SIGNED"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Verified ({signatures.filter((s) => s.status === "SIGNED").length})
          </button>
          <button
            onClick={() => setFilterStatus("PENDING")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterStatus === "PENDING"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pending Action ({signatures.filter((s) => s.status === "PENDING").length})
          </button>
        </div>
      </div>

      {/* Signatures Audit Table */}
      <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Document</th>
                <th className="py-3.5 px-4 font-semibold">Signatory</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Timestamp / Verification</th>
                <th className="py-3.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredSignatures.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No signature records matching filter.
                  </td>
                </tr>
              ) : (
                filteredSignatures.map((sig) => {
                  const isSigned = sig.status === "SIGNED";
                  const canSignNow =
                    !isSigned && currentUser && sig.user.id === currentUser.id;

                  return (
                    <tr
                      key={sig.id}
                      className="hover:bg-slate-900/40 transition-colors group"
                    >
                      {/* Document info */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/documents/${sig.document.id}`}
                          className="font-semibold text-slate-200 hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                          <span className="line-clamp-1">{sig.document.title}</span>
                        </Link>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>{sig.document.category}</span>
                          <span>•</span>
                          <span className="font-mono">v{sig.document.version}.0</span>
                        </div>
                      </td>

                      {/* Signatory info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {sig.user.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={sig.user.avatarUrl}
                              alt={sig.user.name}
                              className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                              {sig.user.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-slate-200 flex items-center gap-1.5">
                              <span>{sig.user.name}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                                  sig.user.role === "ADMIN"
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                    : sig.user.role === "VALIDATOR"
                                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                    : "bg-slate-800 text-slate-300 border border-slate-700"
                                }`}
                              >
                                {sig.user.role}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {sig.user.department}
                            </div>
                            <div className="text-[10px] text-slate-400 line-clamp-1 max-w-[200px]">
                              <strong className="text-slate-300">Skills:</strong> {sig.user.skills}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status & Validation Level badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                              isSigned
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {isSigned ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Verified
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3" /> Pending
                              </>
                            )}
                          </span>

                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">
                            {sig.validationLevel}
                          </span>
                        </div>
                      </td>

                      {/* Timestamp & SHA-256 Digest */}
                      <td className="py-3.5 px-4">
                        {isSigned ? (
                          <div className="space-y-1">
                            <div className="font-mono text-slate-300 text-[11px]">
                              {formatDateTime(sig.signedAt)}
                            </div>
                            {sig.signatureHash && (
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                <span className="font-mono text-indigo-400">
                                  {sig.signatureHash.substring(0, 16)}...
                                </span>
                                <button
                                  onClick={() => handleCopyHash(sig.signatureHash!)}
                                  className="text-slate-400 hover:text-white"
                                  title="Copy complete SHA-256 checksum"
                                >
                                  {copiedHash === sig.signatureHash ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Awaiting execution
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {canSignNow ? (
                          <button
                            onClick={() => setActiveSigningItem(sig)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Sign Now
                          </button>
                        ) : (
                          <Link
                            href={`/documents/${sig.document.id}`}
                            className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-400 transition-colors text-xs"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Signature Modal */}
      {activeSigningItem && currentUser && (
        <SignatureModal
          isOpen={Boolean(activeSigningItem)}
          onClose={() => setActiveSigningItem(null)}
          documentId={activeSigningItem.document.id}
          documentTitle={activeSigningItem.document.title}
          documentVersion={activeSigningItem.document.version}
          signatureId={activeSigningItem.id}
          user={currentUser}
          onSuccess={() => {
            fetchSignatures();
          }}
        />
      )}
    </div>
  );
}
