"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Copy,
  Check,
} from "lucide-react";
import { useCurrentUser } from "@/components/providers/UserContext";
import { SignatureModal } from "@/components/signatures/SignatureModal";

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

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredSignatures = signatures.filter((s) => {
    if (filterStatus === "SIGNED") return s.status === "SIGNED";
    if (filterStatus === "PENDING") return s.status === "PENDING";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-medium text-slate-800">Compliance &amp; Signatures</h1>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Immutable cryptographic audit trail for document validation and regulatory sign-offs.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center p-1 bg-white border border-slate-200 rounded-full">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterStatus === "ALL"
                ? "bg-slate-100 text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            All ({metrics.total})
          </button>
          <button
            onClick={() => setFilterStatus("SIGNED")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterStatus === "SIGNED"
                ? "bg-slate-100 text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Signed ({metrics.signed})
          </button>
          <button
            onClick={() => setFilterStatus("PENDING")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterStatus === "PENDING"
                ? "bg-slate-100 text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Pending ({metrics.pending})
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-100 p-6 space-y-1">
          <span className="text-xs font-medium text-slate-400">Total Sign-off Requests</span>
          <p className="text-2xl font-medium text-slate-800">{metrics.total}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-100 p-6 space-y-1">
          <span className="text-xs font-medium text-slate-400">Verified Signatures</span>
          <p className="text-2xl font-medium text-emerald-600">{metrics.signed}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-100 p-6 space-y-1">
          <span className="text-xs font-medium text-slate-400">Pending Actions</span>
          <p className="text-2xl font-medium text-violet-600">{metrics.pending}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-100 p-6 space-y-1">
          <span className="text-xs font-medium text-slate-400">Compliance Rate</span>
          <p className="text-2xl font-medium text-blue-600">{metrics.complianceRate}%</p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-100 p-6 space-y-4 overflow-hidden">
        <h2 className="text-lg font-medium text-slate-800">
          Cryptographic Signature Ledger
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-100/70 animate-pulse" />
            ))}
          </div>
        ) : filteredSignatures.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No signature records found matching this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSignatures.map((sig) => {
              const isSigned = sig.status === "SIGNED";
              const isForCurrent = currentUser?.id === sig.user.id;

              return (
                <div
                  key={sig.id}
                  className="bg-slate-50 rounded-2xl border border-slate-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                        isSigned
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-violet-100 text-violet-600"
                      }`}
                    >
                      {isSigned ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/documents/${sig.document.id}`}
                          className="text-xs font-medium text-slate-800 hover:text-blue-600 truncate"
                        >
                          {sig.document.title}
                        </Link>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500">
                          v{sig.document.version}.0
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Assigned Signer: <strong className="text-slate-700 font-medium">{sig.user.name}</strong> ({sig.user.role})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-auto">
                    {isSigned ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-3 py-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-white shadow-[0_2px_8px_rgba(52,211,153,0.3)]">
                          Signed
                        </span>
                        {sig.signatureHash && (
                          <button
                            onClick={() => handleCopy(sig.signatureHash!)}
                            className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                            title="Copy SHA-256 Hash"
                          >
                            {copiedHash === sig.signatureHash ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-3 py-1 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 text-white shadow-[0_2px_8px_rgba(167,139,250,0.3)]">
                          Action Required
                        </span>
                        {isForCurrent && (
                          <button
                            onClick={() => setActiveSigningItem(sig)}
                            className="px-3.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-xs"
                          >
                            Sign
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activeSigningItem && (
        <SignatureModal
          isOpen={!!activeSigningItem}
          onClose={() => setActiveSigningItem(null)}
          documentTitle={activeSigningItem.document.title}
          documentVersion={activeSigningItem.document.version}
          signatureId={activeSigningItem.id}
          requiredValidationLevel={
            activeSigningItem.document.requiredValidationLevel || activeSigningItem.validationLevel
          }
          onSuccess={() => {
            setActiveSigningItem(null);
            fetchSignatures();
          }}
        />
      )}
    </div>
  );
}
