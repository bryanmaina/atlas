"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  X,
  CheckCircle2,
  FileCheck,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import { UserPersona, useCurrentUser } from "@/components/providers/UserContext";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  documentVersion: number;
  signatureId: string;
  requiredValidationLevel?: string;
  user?: UserPersona;
  onSuccess: () => void;
}

export function SignatureModal({
  isOpen,
  onClose,
  documentTitle,
  documentVersion,
  signatureId,
  requiredValidationLevel,
  user,
  onSuccess,
}: SignatureModalProps) {
  const { currentUser } = useCurrentUser();
  const activeUser = user || currentUser;

  const [acknowledged, setAcknowledged] = useState(false);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<{
    signatureHash: string;
    timestamp: string;
    signatory: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [securityCode, setSecurityCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSign = async () => {
    if (!acknowledged || !activeUser) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSecurityCode(null);

    try {
      const res = await fetch(`/api/signatures/${signatureId}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-atlas-user-id": activeUser.id,
        },
        body: JSON.stringify({
          comments: comments.trim() || undefined,
          statement:
            "I confirm that I have reviewed this document in its entirety and agree to adhere strictly to all contained procedures and requirements.",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReceipt({
          signatureHash: data.receipt.signatureHash,
          timestamp: data.receipt.timestamp,
          signatory: data.receipt.signatory,
        });
        onSuccess();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || "Failed to submit signature");
        if (err.securityCode) {
          setSecurityCode(err.securityCode);
        }
      }
    } catch (error) {
      console.error("Signature error:", error);
      setErrorMessage("Network error while submitting signature");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyHash = () => {
    if (!receipt?.signatureHash) return;
    navigator.clipboard.writeText(receipt.signatureHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl bg-white/95 backdrop-blur-2xl border border-slate-100 shadow-2xl p-6 sm:p-8 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!receipt ? (
          <div className="space-y-5">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>Compliance Attestation</span>
              </div>
              <h2 className="text-2xl font-medium text-slate-800">
                Execute Digital Signature
              </h2>
              <p className="text-xs font-medium text-slate-400 mt-1">
                Cryptographically verifiable signature logged to the audit ledger.
              </p>
            </div>

            {/* Document Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>Document:</span>
                <span className="font-medium text-slate-800 truncate max-w-[220px]">
                  {documentTitle}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Version:</span>
                <span className="font-medium text-slate-800">v{documentVersion}.0</span>
              </div>
              {requiredValidationLevel && (
                <div className="flex items-center justify-between text-slate-500">
                  <span>Required Authority:</span>
                  <span className="font-medium text-blue-600">
                    {requiredValidationLevel}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-500 pt-2 border-t border-slate-200/60">
                <span>Signatory:</span>
                <span className="font-medium text-slate-800">
                  {activeUser?.name} ({activeUser?.role})
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <div>
                  <span className="font-medium block">Approval Denied</span>
                  <span>{errorMessage}</span>
                  {securityCode && (
                    <div className="mt-1 font-mono text-[10px] text-rose-600">
                      Code: {securityCode}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Comments Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">
                Signer Comments / Reference Notes (Optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={2}
                placeholder="e.g. Reviewed and verified against current policy standards."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-blue-600 accent-blue-500"
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                I attest that I have reviewed this document and authorized its verification.
              </span>
            </label>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSign}
                disabled={!acknowledged || isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-white font-medium text-xs shadow-[0_4px_15px_rgba(52,211,153,0.3)] hover:opacity-95 transition-all disabled:opacity-50"
              >
                <FileCheck className="w-4 h-4" />
                <span>{isSubmitting ? "Signing..." : "Sign Document"}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Receipt View */
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-medium text-slate-800">
              Signature Recorded Successfully!
            </h3>
            <p className="text-xs font-medium text-slate-400">
              Signed by {receipt.signatory} on {receipt.timestamp}
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-1">
              <span className="text-[11px] font-medium text-slate-400 block">
                Cryptographic Hash (SHA-256):
              </span>
              <div className="flex items-center justify-between gap-2 font-mono text-xs text-slate-700">
                <span className="truncate">{receipt.signatureHash}</span>
                <button
                  onClick={handleCopyHash}
                  className="p-1 rounded text-slate-400 hover:text-slate-700"
                  title="Copy"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full bg-slate-800 text-white text-xs font-medium hover:bg-slate-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
