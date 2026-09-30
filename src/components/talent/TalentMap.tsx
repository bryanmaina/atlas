"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Users,
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium mb-2">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span>In-Memory Vector Skill Matcher</span>
          </div>
          <h1 className="text-2xl font-medium text-slate-800">
            Organizational Talent Map
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1 max-w-xl">
            Query employee skills using vector cosine similarity or extract competencies from work descriptions.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-full self-start md:self-auto">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === "search"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Semantic Matcher
          </button>
          <button
            onClick={() => setActiveTab("extractor")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === "extractor"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Skill Extractor
          </button>
        </div>
      </div>

      {activeTab === "extractor" ? (
        <SkillExtractionCard
          onSkillsExtracted={handleSkillsFromExtractor}
          onQueryChange={(q) => {
            setSearchQuery(q);
            setActiveTab("search");
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Search Controls & Filters */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-100 p-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Query technical skills, libraries, architecture concepts..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-full pl-11 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Role filter */}
              <div className="flex items-center gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">Admin / Approver</option>
                  <option value="VALIDATOR">Validator</option>
                  <option value="CONTRIBUTOR">Contributor</option>
                </select>

                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  <span>Min: {minConfidence}%</span>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    step={5}
                    value={minConfidence}
                    onChange={(e) => setMinConfidence(Number(e.target.value))}
                    className="w-16 accent-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Quick Skill Tags */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
              <span className="text-xs font-medium text-slate-400 mr-1">Popular:</span>
              {QUICK_SKILL_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleQuickTagClick(tag)}
                  className={`text-xs px-3.5 py-1 rounded-full font-medium transition-all ${
                    searchQuery.toLowerCase() === tag.toLowerCase()
                      ? "bg-slate-800 text-white shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Results Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-3xl bg-slate-100/80 animate-pulse border border-slate-200/50"
                />
              ))}
            </div>
          ) : error ? (
            <div className="py-12 text-center bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
              <p className="text-sm font-medium text-rose-600">{error}</p>
            </div>
          ) : experts.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-medium text-slate-700">No matching experts found</h3>
              <p className="text-xs font-medium text-slate-400 mt-1 max-w-sm mx-auto">
                Try lowering the confidence threshold or search for alternative technical terms.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {experts.map((exp) => (
                <ExpertCard key={exp.user.id} expert={exp} highlightSkill={searchQuery} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
