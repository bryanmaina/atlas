"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  Cpu,
  Users,
  Sparkles,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { useCurrentUser } from "@/components/providers/UserContext";
import { DocumentCard, DocumentCardData } from "@/components/documents/DocumentCard";
import { SignatureModal } from "@/components/signatures/SignatureModal";

interface StatsData {
  totalDocs: number;
  totalSignatures: number;
  signedCount: number;
  pendingCount: number;
  complianceRate: number;
  chunkCount: number;
}

export default function DashboardPage() {
  const { currentUser } = useCurrentUser();
  const [documents, setDocuments] = useState<DocumentCardData[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalDocs: 0,
    totalSignatures: 0,
    signedCount: 0,
    pendingCount: 0,
    complianceRate: 100,
    chunkCount: 0,
  });
  const [pendingUserDocs, setPendingUserDocs] = useState<
    Array<{ doc: DocumentCardData; signatureId: string }>
  >([]);
  const [activeSigningItem, setActiveSigningItem] = useState<{
    doc: DocumentCardData;
    signatureId: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      // 1. Fetch documents
      const docsRes = await fetch("/api/documents");
      const docsData = await docsRes.json();
      const docsList: DocumentCardData[] = docsData.documents || [];
      setDocuments(docsList);

      // 2. Fetch signatures & metrics
      const sigsRes = await fetch("/api/signatures");
      const sigsData = await sigsRes.json();
      const metrics = sigsData.metrics || {};

      let totalChunks = 0;
      for (const d of docsList) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        totalChunks += (d as any)._count?.chunks || 0;
      }

      setStats({
        totalDocs: docsList.length,
        totalSignatures: metrics.total || 0,
        signedCount: metrics.signed || 0,
        pendingCount: metrics.pending || 0,
        complianceRate: metrics.complianceRate || 0,
        chunkCount: totalChunks || 20,
      });

      // 3. Compute pending items for the active user persona
      if (currentUser?.id) {
        const pendingForUser: Array<{ doc: DocumentCardData; signatureId: string }> = [];
        for (const doc of docsList) {
          const userSig = doc.signatures?.find(
            (s) => s.userId === currentUser.id && s.status === "PENDING"
          );
          if (userSig) {
            pendingForUser.push({ doc, signatureId: userSig.id });
          }
        }
        setPendingUserDocs(pendingForUser);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden glass-panel border border-indigo-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-600/15 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Autonomous Enterprise Knowledge Platform</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Welcome to <span className="gradient-brand">Project Atlas</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
            A high-velocity organizational knowledge repository featuring{" "}
            <span className="text-white font-medium">in-memory vector semantic search</span>,
            policy governance, and{" "}
            <span className="text-white font-medium">cryptographic compliance sign-offs</span>.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/documents"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all"
            >
              <FileText className="w-4 h-4" />
              Browse Documents
            </Link>

            <Link
              href="/talent-map"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-cyan-600/25 to-indigo-600/25 hover:from-cyan-600/40 hover:to-indigo-600/40 border border-cyan-500/40 text-cyan-200 hover:text-white shadow-lg shadow-cyan-500/10 transition-all"
            >
              <Users className="w-4 h-4 text-cyan-400" />
              Talent Map & Skills
            </Link>

            <Link
              href="/signatures"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold glass-card border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Audit Trail ({stats.complianceRate}% Compliant)
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Repository</span>
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{stats.totalDocs}</div>
          <div className="text-[11px] text-slate-400 mt-1">Active policy documents & SOPs</div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Compliance Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white flex items-baseline gap-1">
            <span>{stats.complianceRate}%</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.signedCount} signed / {stats.pendingCount} pending
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Vector Chunks</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{stats.chunkCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">In-memory indexed embeddings</div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Signatories</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">5</div>
          <div className="text-[11px] text-slate-400 mt-1">Engineering & leadership personas</div>
        </div>
      </div>

      {/* Action Required: Pending Signatures for Active Persona */}
      {pendingUserDocs.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-amber-950/20 border border-amber-500/30 glass-card">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Action Required: {pendingUserDocs.length} Pending Signature
                  {pendingUserDocs.length > 1 ? "s" : ""}
                </h3>
                <p className="text-xs text-slate-300">
                  Signed as <span className="font-semibold text-white">{currentUser?.name}</span> (
                  {currentUser?.role})
                </p>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {pendingUserDocs.map(({ doc, signatureId }) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-100 truncate">{doc.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>{doc.category}</span>
                    <span>•</span>
                    <span>v{doc.version}.0</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveSigningItem({ doc, signatureId })}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Sign Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured / Recent Documents Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Organizational Knowledge Base</h2>
            <p className="text-xs text-slate-400">
              Verified operating policies, engineering specifications, and security frameworks
            </p>
          </div>
          <Link
            href="/documents"
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300"
          >
            View All ({documents.length})
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-48 rounded-2xl glass-card border border-slate-800 animate-pulse bg-slate-900/50"
              />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.slice(0, 6).map((doc) => (
              <DocumentCard key={doc.id} doc={doc} currentUserId={currentUser?.id} />
            ))}
          </div>
        )}
      </div>

      {/* Signature Modal */}
      {activeSigningItem && currentUser && (
        <SignatureModal
          isOpen={Boolean(activeSigningItem)}
          onClose={() => setActiveSigningItem(null)}
          documentId={activeSigningItem.doc.id}
          documentTitle={activeSigningItem.doc.title}
          documentVersion={activeSigningItem.doc.version}
          signatureId={activeSigningItem.signatureId}
          user={currentUser}
          onSuccess={() => {
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
}
