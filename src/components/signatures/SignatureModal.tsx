"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  X,
  Lock,
  CheckCircle2,
  FileCheck,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import { UserPersona } from "@/components/providers/UserContext";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  documentVersion: number;
  signatureId: string;
  user: UserPersona;
  onSuccess: () => void;
}

export function SignatureModal({
  isOpen,
  onClose,
  documentTitle,
  documentVersion,
  signatureId,
  user,
  onSuccess,
}: SignatureModalProps) {
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
    if (!acknowledged) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSecurityCode(null);

    try {
      const res = await fetch(`/api/signatures/${signatureId}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-atlas-user-id": user.id,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl glass-panel border border-slate-700/80 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Execute Digital Signature</h3>
              <p className="text-[11px] text-slate-400">Cryptographically verifiable compliance log</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {receipt ? (
            /* Success Receipt View */
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-base font-bold text-white">Document Successfully Signed</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Your digital signature has been verified and permanently written to the audit trail.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Signatory:</span>
                  <span className="font-semibold text-slate-200">{receipt.signatory}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Timestamp:</span>
                  <span className="font-mono text-slate-300">{new Date(receipt.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-xs text-slate-400 pt-1 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span>SHA-256 Checksum:</span>
                    <button
                      onClick={handleCopyHash}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="p-2 rounded bg-black/60 font-mono text-[11px] text-slate-300 break-all border border-slate-800">
                    {receipt.signatureHash}
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            /* Signing Form View */
            <>
              {/* Document Reference Info */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Target Document
                </div>
                <div className="text-sm font-semibold text-slate-100 flex items-center justify-between">
                  <span className="line-clamp-1">{documentTitle}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    v{documentVersion}.0
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1 pt-1">
                  <span>Signatory:</span>
                  <span className="font-medium text-slate-200">
                    {user.name} ({user.email}) • <strong className="text-indigo-400">{user.role}</strong>
                  </span>
                </div>
              </div>

              {/* Security Alert Callout (IDOR / Unauthorized Approval) */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>Security Validation Blocked</span>
                      {securityCode && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-200 font-mono">
                          {securityCode}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-rose-200 leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Legal Acknowledgment Checkbox */}
              <div className="p-3.5 rounded-xl border border-indigo-900/40 bg-indigo-950/20 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed">
                    I confirm that I have reviewed this document in its entirety, understand the
                    governance standards outlined, and agree to strictly adhere to all procedures.
                  </span>
                </label>
              </div>

              {/* Optional comments */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Audit Notes / Comments (Optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="e.g., Reviewed and certified for the Q3 audit cycle..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input focus:outline-none"
                />
              </div>

              {/* Cryptographic Assurance Note */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Secured with SHA-256 immutable digest verification</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!acknowledged || isSubmitting}
                  onClick={handleSign}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <FileCheck className="w-4 h-4" />
                  {isSubmitting ? "Generating Hash & Signing..." : "Execute Digital Signature"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
