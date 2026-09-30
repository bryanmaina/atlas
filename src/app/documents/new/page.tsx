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
  Info,
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
        alert(err.error || "Failed to create document");
      }
    } catch (err) {
      console.error("Document creation error:", err);
      alert("Error submitting document");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top back button */}
      <div>
        <Link
          href="/documents"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Documents
        </Link>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Draft Knowledge Document</h1>
            <p className="text-xs text-slate-400 mt-1">
              Documents are automatically vectorized and indexed into in-memory semantic search.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                !previewMode
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editor
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                previewMode
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Document Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. SEC-002: Production Secrets Rotation & Key Hygiene SOP"
              className="w-full px-4 py-2.5 rounded-xl text-sm glass-input font-medium"
            />
          </div>

          {/* Category & Tags Row */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Organizational Domain / Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs glass-input font-medium bg-slate-900 text-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. security, cloud-run, compliance"
                className="w-full px-4 py-2.5 rounded-xl text-xs glass-input"
              />
            </div>
          </div>

          {/* Executive Summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Executive Summary (Brief Overview)
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A 1-2 sentence synopsis used for search preview cards and quick scan..."
              className="w-full px-4 py-2.5 rounded-xl text-xs glass-input leading-relaxed"
            />
          </div>

          {/* Content Editor / Preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Document Body (Markdown supported) *
            </label>
            {previewMode ? (
              <div className="w-full min-h-[300px] p-6 rounded-2xl bg-slate-950/70 border border-slate-800 text-slate-200 text-sm leading-relaxed prose prose-invert max-w-none">
                {content.trim() ? (
                  content.split("\n\n").map((para, i) => {
                    if (para.startsWith("## ")) {
                      return (
                        <h2 key={i} className="text-lg font-bold text-white mt-4 mb-2">
                          {para.replace("## ", "")}
                        </h2>
                      );
                    }
                    if (para.startsWith("# ")) {
                      return (
                        <h1 key={i} className="text-xl font-extrabold text-white mt-4 mb-2">
                          {para.replace("# ", "")}
                        </h1>
                      );
                    }
                    if (para.startsWith("- ") || para.startsWith("* ")) {
                      return (
                        <ul key={i} className="list-disc pl-5 my-2 space-y-1 text-slate-300">
                          {para.split("\n").map((line, li) => (
                            <li key={li}>{line.replace(/^[-*]\s*/, "")}</li>
                          ))}
                        </ul>
                      );
                    }
                    return (
                      <p key={i} className="my-2 text-slate-300">
                        {para}
                      </p>
                    );
                  })
                ) : (
                  <p className="text-slate-400 italic">No content to preview yet.</p>
                )}
              </div>
            ) : (
              <textarea
                required
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write standard operating procedures, architectural specs, or policy rules in markdown...&#10;&#10;## 1. Overview & Purpose&#10;Describe the core objective...&#10;&#10;## 2. Requirements&#10;- Zero-trust authentication&#10;- Encrypted data volume"
                className="w-full px-4 py-3 rounded-2xl text-xs font-mono glass-input leading-relaxed"
              />
            )}
          </div>

          {/* Compliance & Sign-off Governance Option */}
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex items-start gap-3">
            <input
              type="checkbox"
              id="requiresSignoff"
              checked={requiresSignoff}
              onChange={(e) => setRequiresSignoff(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
            />
            <label htmlFor="requiresSignoff" className="cursor-pointer text-xs space-y-1">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Require Formal Employee Sign-off
              </span>
              <p className="text-slate-400 leading-relaxed">
                If enabled, a formal digital signature request will be created for active
                organizational personnel with cryptographic SHA-256 verification and audit tracking.
              </p>
            </label>
          </div>

          {/* Author attribution pill */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                Publishing as: <strong className="text-slate-200">{currentUser?.name}</strong> (
                {currentUser?.role})
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all"
            >
              <FileCheck className="w-4 h-4" />
              {isSubmitting ? "Vector Indexing..." : "Publish & Index Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
