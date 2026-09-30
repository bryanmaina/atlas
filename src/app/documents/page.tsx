"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
} from "lucide-react";
import { useCurrentUser } from "@/components/providers/UserContext";
import { DocumentCard, DocumentCardData } from "@/components/documents/DocumentCard";

const CATEGORIES = [
  "All",
  "Engineering",
  "Security",
  "People & HR",
  "Product & AI",
  "Operations",
];

export default function DocumentsPage() {
  const { currentUser } = useCurrentUser();
  const [documents, setDocuments] = useState<DocumentCardData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [signoffFilter, setSignoffFilter] = useState<"ALL" | "SIGNOFF" | "STANDARD">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/documents");
        if (res.ok) {
          const data = await res.json();
          setDocuments(data.documents || []);
        }
      } catch (err) {
        console.error("Error loading documents:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory =
      selectedCategory === "All" ||
      doc.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSignoff =
      signoffFilter === "ALL" ||
      (signoffFilter === "SIGNOFF" && doc.requiresSignoff) ||
      (signoffFilter === "STANDARD" && !doc.requiresSignoff);

    const matchesQuery =
      !searchQuery.trim() ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSignoff && matchesQuery;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Document Repository</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse and manage company-wide policies, standard operating procedures, and specifications
          </p>
        </div>

        <Link
          href="/documents/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Draft New Document
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter documents by title, summary, or keyword..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs glass-input focus:outline-none"
          />
        </div>

        {/* Sign-off toggle pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800 self-start md:self-auto text-xs">
          <button
            onClick={() => setSignoffFilter("ALL")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              signoffFilter === "ALL"
                ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setSignoffFilter("SIGNOFF")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              signoffFilter === "SIGNOFF"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sign-off Required
          </button>
          <button
            onClick={() => setSignoffFilter("STANDARD")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              signoffFilter === "STANDARD"
                ? "bg-slate-800 text-slate-200 border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Informational
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : "bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-52 rounded-2xl glass-card border border-slate-800 animate-pulse bg-slate-900/50"
            />
          ))}
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="py-16 text-center rounded-2xl glass-card border border-slate-800">
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No matching documents found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your category filter, search query, or draft a new document.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} currentUserId={currentUser?.id} />
          ))}
        </div>
      )}
    </div>
  );
}
