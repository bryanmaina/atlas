"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileCheck,
  ShieldCheck,
  Eye,
  Edit3,
} from "lucide-react";
import { useCurrentUser } from "@/components/providers/UserContext";

const CATEGORIES = [
  "Engineering",
  "Security",
  "People & HR",
  "Product & AI",
  "Operations",
  "Legal & Finance",
];

export default function NewDocumentPage() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Engineering");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [requiresSignoff, setRequiresSignoff] = useState(false);
  const [tags, setTags] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("Please provide both a title and content for the document.");
      return;
    }

    if (!currentUser?.id) {
      alert("Please select an active user persona in the top right menu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          summary: summary.trim() || undefined,
          content: content.trim(),
          requiresSignoff,
          tags: tags.trim() || undefined,
          authorId: currentUser.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/documents/${data.document.id}`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create document.");
      }
    } catch (err) {
      console.error("Document creation failed:", err);
      alert("Network error creating document.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/documents"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel &amp; Return</span>
        </Link>
      </div>

      {/* Editor Container */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-medium text-slate-800">Draft Document</h1>
            <p className="text-xs font-medium text-slate-400 mt-1">
              Create a new organizational policy, SOP, or engineering specification.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-full">
            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                !previewMode
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Write
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                previewMode
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-500">
              Document Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. SEC-002: Production Secrets Rotation & Key Hygiene SOP"
              className="w-full px-4 py-2.5 rounded-2xl text-xs bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Category & Tags Row */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-500">
                Organizational Domain / Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl text-xs bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-500">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. security, cloud-run, compliance"
                className="w-full px-4 py-2.5 rounded-2xl text-xs bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-500">
              Executive Summary (Brief Overview)
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A 1-2 sentence synopsis used for search preview cards and quick scan..."
              className="w-full px-4 py-2.5 rounded-2xl text-xs bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none leading-relaxed"
            />
          </div>

          {/* Content Editor / Preview */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-500">
              Document Body (Markdown supported) *
            </label>
            {previewMode ? (
              <div className="w-full min-h-[300px] p-6 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs leading-relaxed space-y-3">
                {content.trim() ? (
                  content.split("\n\n").map((para, i) => {
                    if (para.startsWith("## ")) {
                      return (
                        <h2 key={i} className="text-sm font-medium text-slate-800 mt-3 mb-1">
                          {para.replace("## ", "")}
                        </h2>
                      );
                    }
                    if (para.startsWith("# ")) {
                      return (
                        <h1 key={i} className="text-base font-medium text-slate-800 mt-3 mb-1">
                          {para.replace("# ", "")}
                        </h1>
                      );
                    }
                    return <p key={i}>{para}</p>;
                  })
                ) : (
                  <span className="italic text-slate-400">
                    Nothing to preview yet. Switch back to &lsquo;Write&rsquo; to author content.
                  </span>
                )}
              </div>
            ) : (
              <textarea
                required
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your policy or procedure using Markdown headers (##), bullet points (-), and bold text (**)..."
                className="w-full p-4 rounded-2xl text-xs bg-slate-50 border border-slate-200 text-slate-800 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            )}
          </div>

          {/* Compliance Checkbox */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <input
              type="checkbox"
              id="requiresSignoff"
              checked={requiresSignoff}
              onChange={(e) => setRequiresSignoff(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 accent-blue-500 cursor-pointer"
            />
            <label htmlFor="requiresSignoff" className="cursor-pointer">
              <div className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-violet-500" />
                <span>Require Compliance Verification Sign-Off</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Enforces dual-user signature workflow before this document transitions from Draft to Verified.
              </p>
            </label>
          </div>

          {/* Submit Row */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs font-medium text-slate-400">
              Author: <strong className="text-slate-700">{currentUser?.name || "Anonymous"}</strong> ({currentUser?.role})
            </span>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-400 to-teal-400 text-white shadow-[0_4px_15px_rgba(52,211,153,0.3)] hover:opacity-95 transition-all disabled:opacity-50"
            >
              <FileCheck className="w-4 h-4" />
              <span>{isSubmitting ? "Publishing..." : "Publish Document"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
