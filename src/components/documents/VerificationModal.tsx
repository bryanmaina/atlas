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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white/95 backdrop-blur-2xl border border-slate-100 p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-medium text-slate-800">
              Signature Recorded Successfully!
            </h3>
            <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto">
              {isFinalStep
                ? "Second distinct signature verified. Document status changed to 'Verified'!"
                : "First signature recorded. Awaiting second distinct signature."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium mb-2">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span>
                  Information Verification Workflow (Signature {targetStep} of 2)
                </span>
              </div>
              <h2 className="text-2xl font-medium text-slate-800">
                Execute Verification Signature
              </h2>
              <p className="text-xs font-medium text-slate-400 mt-1">
                Document requires exactly two distinct user signatures to elevate status to{" "}
                <strong className="text-emerald-600 font-medium">&lsquo;Verified&rsquo;</strong>.
              </p>
            </div>

            {/* Document & Signer Info Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>Document:</span>
                <span className="font-medium text-slate-800 truncate max-w-[240px]">
                  {documentTitle} (v{documentVersion}.0)
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Active Signer:</span>
                <span className="font-medium text-blue-600">
                  {currentUser?.name || "Anonymous"} ({currentUser?.role})
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500 pt-2 border-t border-slate-200/60">
                <span>Workflow Impact:</span>
                <span
                  className={`font-medium ${
                    isFinalStep ? "text-emerald-600" : "text-violet-600"
                  }`}
                >
                  {isFinalStep
                    ? "Completes Dual Verification (Changes status to Verified)"
                    : "Sets 1 of 2 Signed (Awaiting 2nd distinct signature)"}
                </span>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-medium block">Signature Rejected</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Formal Statement */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">
                Attestation Statement
              </label>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none text-slate-700"
                required
              />
            </div>

            {/* Comments */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">
                Validation Comments / Notes
              </label>
              <input
                type="text"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="e.g., Reviewed against ISO 27001 standards."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
              />
            </div>

            {/* Cryptographic Assurance Note */}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Lock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
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
                className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-white font-medium text-xs shadow-[0_4px_15px_rgba(52,211,153,0.3)] hover:opacity-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing &amp; Verifying...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Sign ({targetStep} of 2)</span>
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
