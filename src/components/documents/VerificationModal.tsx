"use client";

import React, { useState } from "react";
import {
  X,
  Lock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Users,
} from "lucide-react";
import { useCurrentUser } from "@/components/providers/UserContext";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  documentVersion: number;
  currentSignaturesCount: number;
  onSuccess: () => void;
}

export function VerificationModal({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  documentVersion,
  currentSignaturesCount,
  onSuccess,
}: VerificationModalProps) {
  const { currentUser, authFetch } = useCurrentUser();
  const [statement, setStatement] = useState(
    "I have thoroughly reviewed these specifications and attest to their technical and architectural validity."
  );
  const [comments, setComments] = useState("Technical verification sign-off.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const targetStep = currentSignaturesCount + 1;
  const isFinalStep = targetStep >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError("Please select an active user profile in the navigation bar.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await authFetch(`/api/documents/${documentId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statement,
          comments,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.code === "DUPLICATE_SIGNATURE_FORBIDDEN") {
          setError(
            `Duplicate Signature Rejected: User '${currentUser.name}' has already signed this document. Exactly two distinct user signatures are required to verify.`
          );
        } else {
          setError(data.error || data.message || "Failed to execute signature.");
        }
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Verification submit error:", err);
      setError("Network or server error executing verification signature.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel border border-indigo-500/30 p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Top ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-600/20 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">
              Signature Recorded Successfully!
            </h3>
            <p className="text-sm text-slate-300 max-w-sm mx-auto">
              {isFinalStep
                ? "Second distinct signature verified. Document status changed to 'Verified' (Green light)!"
                : "First signature recorded (Yellow light). Awaiting second distinct signature."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  Information Verification Workflow (Signature {targetStep} of 2)
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Execute Verification Signature
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Document requires exactly two distinct user signatures to elevate status to{" "}
                <strong className="text-emerald-400">&lsquo;Verified&rsquo;</strong>.
              </p>
            </div>

            {/* Document & Signer Info Box */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Document:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[240px]">
                  {documentTitle} (v{documentVersion}.0)
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Active Signer:</span>
                <span className="font-semibold text-indigo-300">
                  {currentUser?.name || "Anonymous"} ({currentUser?.role})
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/60">
                <span>Workflow Impact:</span>
                <span
                  className={`font-semibold ${
                    isFinalStep ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {isFinalStep
                    ? "Completes Dual Verification (Changes status to Verified)"
                    : "Sets Yellow Light (Requires 1 more distinct signature)"}
                </span>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block">Signature Rejected</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Formal Statement */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Attestation Statement
              </label>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                rows={2}
                className="w-full glass-input rounded-xl p-3 text-xs focus:outline-none resize-none text-slate-200"
                required
              />
            </div>

            {/* Comments */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Validation Comments / Notes
              </label>
              <input
                type="text"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="e.g., Reviewed against ISO 27001 standards."
                className="w-full glass-input rounded-xl px-3 py-2 text-xs focus:outline-none text-slate-200"
              />
            </div>

            {/* Cryptographic Assurance Note */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>
                Generates immutable SHA-256 hash proof with server-verified identity.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing & Verifying...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Confirm & Sign ({targetStep} of 2)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
