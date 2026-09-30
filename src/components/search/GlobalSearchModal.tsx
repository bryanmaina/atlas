"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  X,
  FileText,
  CornerDownLeft,
  ArrowRight,
  Cpu,
} from "lucide-react";
import { SearchResult } from "@/lib/vector-store";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_QUERIES = [
  "Information security key policy",
  "Home office equipment stipend",
  "Cloud Run memory and container standards",
  "Incident severity levels and SEV-1 response",
  "Responsible AI data governance boundaries",
];

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Handle keyboard shortcut Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: query.trim(), topK: 5 }),
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (err) {
        console.error("Vector search error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelectDocument = (docId: string) => {
    onClose();
    router.push(`/documents/${docId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/30 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-3xl bg-white/95 backdrop-blur-2xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-5 py-4 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search organizational policies, SOPs, and guides semantically..."
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-sm focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs font-mono font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-md">
              ESC
            </kbd>
          )}
        </div>

        {/* Vector Engine Indicator Bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2 font-medium">
            <Cpu className="w-3.5 h-3.5 text-blue-500" />
            <span>In-Memory Vector Engine • Cosine Similarity</span>
          </div>
          {isLoading && (
            <span className="flex items-center gap-1.5 text-slate-400 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
              Computing similarity...
            </span>
          )}
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-5 space-y-3">
          {query.trim().length === 0 ? (
            <div className="py-4">
              <p className="text-xs font-medium text-slate-400 mb-3">
                Suggested Semantic Queries
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESET_QUERIES.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setQuery(preset)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-blue-500" />
                    {preset}
                  </button>
                ))}
              </div>

              <div className="mt-8 text-center text-xs text-slate-400">
                Type natural language questions or concept phrases to retrieve matched document chunks.
              </div>
            </div>
          ) : results.length === 0 && !isLoading ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-medium text-slate-600">No semantically matching documents found.</p>
              <p className="text-xs mt-1 text-slate-400">
                Try searching for related keywords like &quot;security&quot;, &quot;remote work&quot;, &quot;Cloud Run&quot;, or &quot;SOP&quot;.
              </p>
            </div>
          ) : (
            results.map((result) => {
              const scorePercent = result.matchPercentage;
              const isHighMatch = scorePercent >= 75;

              return (
                <div
                  key={result.chunkId}
                  onClick={() => handleSelectDocument(result.documentId)}
                  className="group p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50 hover:bg-white hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <h4 className="text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                        {result.documentTitle}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-white text-slate-500 border border-slate-200">
                        {result.documentCategory}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          isHighMatch
                            ? "bg-gradient-to-r from-emerald-400 to-teal-400 text-white shadow-[0_2px_8px_rgba(52,211,153,0.3)]"
                            : "bg-gradient-to-r from-blue-300 to-cyan-300 text-slate-800 shadow-[0_2px_8px_rgba(147,197,253,0.4)]"
                        }`}
                      >
                        {scorePercent}% Match
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed pl-6 border-l-2 border-slate-200 my-2">
                    {result.chunkText}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 pl-6">
                    <span className="font-mono text-[11px]">Chunk #{result.chunkIndex + 1}</span>
                    <span className="inline-flex items-center gap-1 text-blue-600 font-medium group-hover:translate-x-0.5 transition-transform">
                      View Document <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>
            Tip: Press <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white border border-slate-200 rounded text-slate-600">Cmd+K</kbd> anywhere to search
          </span>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Open</span>
            <CornerDownLeft className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
