"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Users,
  Sparkles,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import { ExpertCard } from "./ExpertCard";
import { SkillExtractionCard } from "./SkillExtractionCard";
import { searchExpertsAction } from "@/app/actions/talent";
import { ExpertMatchResult } from "@/lib/talent-store";

const QUICK_SKILL_TAGS = [
  "Kubernetes",
  "Next.js",
  "Cloud Architecture",
  "Security Review",
  "Distributed Systems",
  "Go",
  "Frontend Performance",
  "Risk Management",
  "REST APIs",
  "Executive Sign-off",
];

export function TalentMap() {
  const [searchQuery, setSearchQuery] = useState("Kubernetes");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [minConfidence, setMinConfidence] = useState<number>(30);
  const [experts, setExperts] = useState<ExpertMatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"search" | "extractor">("search");

  // Perform vector similarity search via Server Action
  const executeSearch = useCallback(
    async (queryText: string, role = roleFilter, threshold = minConfidence) => {
      if (!queryText.trim()) {
        setExperts([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await searchExpertsAction(queryText, {
          roleFilter: role === "ALL" ? undefined : role,
          minConfidence: threshold,
          limit: 12,
        });

        if (res.success) {
          setExperts(res.experts || []);
        } else {
          setError(res.error || "Failed to search experts.");
        }
      } catch (err) {
        console.error("Talent map search error:", err);
        setError("Error connecting to in-memory talent vector store.");
      } finally {
        setIsLoading(false);
      }
    },
    [roleFilter, minConfidence]
  );

  // Trigger search on mount with default query
  useEffect(() => {
    executeSearch(searchQuery, roleFilter, minConfidence);
  }, [executeSearch, searchQuery, roleFilter, minConfidence]);

  const handleQuickTagClick = (tag: string) => {
    setSearchQuery(tag);
    executeSearch(tag, roleFilter, minConfidence);
  };

  const handleSkillsFromExtractor = (skills: string[]) => {
    if (skills.length > 0) {
      const combined = skills.slice(0, 3).join(", ");
      setSearchQuery(combined);
      executeSearch(combined, roleFilter, minConfidence);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden glass-panel border border-indigo-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-600/15 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-4">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>In-Memory Vector Skill Matcher</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Enterprise Talent Map & Skill Search
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Discover peer subject matter experts and technical sign-off authorities across your organization using cosine similarity vector search and automated skill extraction.
          </p>

          {/* Navigation Mode Switcher */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => setActiveTab("search")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "search"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800"
              }`}
            >
              Skill Query & Vector Search
            </button>
            <button
              onClick={() => setActiveTab("extractor")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "extractor"
                  ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
                  : "bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              Work Description Extractor (Server Action)
            </button>
          </div>
        </div>
      </div>

      {/* Skill Extraction Lab (When in Extractor Mode or as Collapsible) */}
      {activeTab === "extractor" && (
        <SkillExtractionCard
          onSkillsExtracted={handleSkillsFromExtractor}
          onQueryChange={(q) => {
            setSearchQuery(q);
            executeSearch(q, roleFilter, minConfidence);
          }}
        />
      )}

      {/* Search & Filtering Panel */}
      <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  executeSearch(searchQuery);
                }
              }}
              placeholder="Query any skill, framework, or competency (e.g. 'Kubernetes', 'Next.js', 'Security Auditing')..."
              className="w-full glass-input rounded-xl pl-11 pr-24 py-2.5 text-sm focus:outline-none placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={() => executeSearch(searchQuery)}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
            >
              Search
            </button>
          </div>

          {/* Role Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            {(["ALL", "ADMIN", "VALIDATOR", "CONTRIBUTOR"] as const).map(
              (role) => (
                <button
                  key={role}
                  onClick={() => {
                    setRoleFilter(role);
                    executeSearch(searchQuery, role, minConfidence);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    roleFilter === role
                      ? "bg-indigo-600 text-white font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {role === "ALL" ? "All Roles" : role}
                </button>
              )
            )}
          </div>
        </div>

        {/* Quick Skill Tags */}
        <div className="flex items-center flex-wrap gap-2 pt-1 border-t border-slate-800/60">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-slate-500" />
            Popular Skills:
          </span>
          {QUICK_SKILL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleQuickTagClick(tag)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                searchQuery.toLowerCase() === tag.toLowerCase()
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 font-semibold"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Matched Subject Matter Experts
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
              {experts.length} found
            </span>
          </div>

          {searchQuery && (
            <span className="text-xs text-slate-400">
              Ranked by vector cosine similarity for &ldquo;
              <strong className="text-indigo-300">{searchQuery}</strong>&rdquo;
            </span>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl glass-card p-6 animate-pulse flex flex-col justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-13 h-13 rounded-xl bg-slate-800" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-800 rounded w-1/2" />
                    <div className="h-3 bg-slate-800 rounded w-1/3" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                </div>
                <div className="h-4 bg-slate-800 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-2xl p-6 glass-card border border-rose-500/30 text-rose-300 text-center">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && experts.length === 0 && (
          <div className="rounded-3xl glass-panel p-12 text-center border border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">No Matching Experts Found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
              No employees matched the queried skill with confidence above {minConfidence}%. Try broadening your search or extracting skills from a project description.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setMinConfidence(15);
                  executeSearch(searchQuery, roleFilter, 15);
                }}
                className="text-xs px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
              >
                Lower Confidence Threshold
              </button>
              <button
                onClick={() => handleQuickTagClick("Kubernetes")}
                className="text-xs px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
              >
                Reset to &lsquo;Kubernetes&rsquo;
              </button>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && !error && experts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experts.map((expert) => (
              <ExpertCard
                key={expert.user.id}
                expert={expert}
                highlightSkill={searchQuery}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
