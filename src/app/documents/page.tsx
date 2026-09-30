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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-medium text-slate-800">Document Repository</h1>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Browse and manage company-wide policies, standard operating procedures, and specifications
          </p>
        </div>

        <Link
          href="/documents/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-400 to-teal-400 text-white shadow-[0_4px_15px_rgba(52,211,153,0.3)] hover:opacity-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Draft New Document</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-slate-800 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search & Signoff Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter titles or tags..."
              className="w-full bg-white border border-slate-200 rounded-full pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-full">
            <button
              onClick={() => setSignoffFilter("ALL")}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                signoffFilter === "ALL"
                  ? "bg-slate-100 text-slate-800 font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSignoffFilter("SIGNOFF")}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                signoffFilter === "SIGNOFF"
                  ? "bg-slate-100 text-slate-800 font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign-Offs
            </button>
          </div>
        </div>
      </div>

      {/* Document Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-56 rounded-3xl bg-slate-100/80 animate-pulse border border-slate-200/50"
            />
          ))}
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-slate-700">No documents found</h3>
          <p className="text-xs font-medium text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or create a new document specification.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} currentUserId={currentUser?.id} />
          ))}
        </div>
      )}
    </div>
  );
}
