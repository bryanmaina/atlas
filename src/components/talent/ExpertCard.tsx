"use client";

import React from "react";
import Image from "next/image";
import {
  ShieldCheck,
  CheckCircle,
  Code,
  Building,
  Mail,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { ExpertMatchResult } from "@/lib/talent-store";

interface ExpertCardProps {
  expert: ExpertMatchResult;
  highlightSkill?: string;
  onSelect?: (expert: ExpertMatchResult) => void;
}

export function ExpertCard({ expert, highlightSkill, onSelect }: ExpertCardProps) {
  const { user, matchConfidence, matchedSkills, matchReasoning } = expert;

  const getRoleBadge = (role: string) => {
    switch (role.toUpperCase()) {
      case "ADMIN":
        return {
          label: "Admin / Executive",
          bg: "bg-purple-500/15 border-purple-500/30 text-purple-300",
          icon: ShieldCheck,
        };
      case "VALIDATOR":
        return {
          label: "Technical Validator",
          bg: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300",
          icon: CheckCircle,
        };
      case "CONTRIBUTOR":
      default:
        return {
          label: "Contributor",
          bg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
          icon: Code,
        };
    }
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 85) {
      return {
        label: "Exceptional Match",
        color: "text-emerald-400",
        border: "border-emerald-500/30",
        bg: "bg-emerald-500/10",
        barColor: "from-emerald-500 to-teal-400",
      };
    }
    if (confidence >= 70) {
      return {
        label: "High Fit",
        color: "text-cyan-400",
        border: "border-cyan-500/30",
        bg: "bg-cyan-500/10",
        barColor: "from-cyan-500 to-blue-500",
      };
    }
    return {
      label: "Capable Match",
      color: "text-indigo-400",
      border: "border-indigo-500/30",
      bg: "bg-indigo-500/10",
      barColor: "from-indigo-500 to-purple-500",
    };
  };

  const roleBadge = getRoleBadge(user.role);
  const confidenceMeta = getConfidenceLevel(matchConfidence);
  const RoleIcon = roleBadge.icon;

  return (
    <div className="group relative rounded-2xl glass-card p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/40">
      {/* Top Header: Avatar & Match Confidence */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.name}
                  width={52}
                  height={52}
                  unoptimized
                  className="rounded-xl object-cover ring-2 ring-slate-700/50 group-hover:ring-indigo-500/50 transition-all"
                />
              ) : (
                <div className="w-13 h-13 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {user.name.charAt(0)}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                {user.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${roleBadge.bg}`}
                >
                  <RoleIcon className="w-3 h-3" />
                  {roleBadge.label}
                </span>
              </div>
            </div>
          </div>

          {/* Match Confidence Score Pill */}
          <div
            className={`flex flex-col items-end px-3 py-1.5 rounded-xl border ${confidenceMeta.bg} ${confidenceMeta.border}`}
          >
            <div className="flex items-center gap-1">
              <Sparkles className={`w-3.5 h-3.5 ${confidenceMeta.color}`} />
              <span className={`text-lg font-bold tracking-tight ${confidenceMeta.color}`}>
                {matchConfidence}%
              </span>
            </div>
            <span className="text-[10px] font-medium text-slate-400">
              {confidenceMeta.label}
            </span>
          </div>
        </div>

        {/* Confidence Progress Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-1.5 mb-4 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${confidenceMeta.barColor} transition-all duration-700`}
            style={{ width: `${matchConfidence}%` }}
          />
        </div>

        {/* Metadata: Department & Email */}
        <div className="space-y-1 text-xs text-slate-400 mb-4">
          {user.department && (
            <div className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span>{user.department}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-300 truncate">{user.email}</span>
          </div>
        </div>

        {/* Match Reasoning Quote */}
        {matchReasoning && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 italic">
            &ldquo;{matchReasoning}&rdquo;
          </div>
        )}

        {/* Skills Section */}
        <div className="space-y-2 mb-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Verified Competencies
          </div>
          <div className="flex flex-wrap gap-1.5">
            {user.skillsList.map((skill) => {
              const isMatched =
                matchedSkills.includes(skill) ||
                (highlightSkill &&
                  skill.toLowerCase().includes(highlightSkill.toLowerCase()));

              return (
                <span
                  key={skill}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                    isMatched
                      ? "bg-indigo-500/25 text-cyan-300 border border-indigo-400/40 shadow-sm shadow-indigo-500/20 font-semibold"
                      : "bg-slate-800/60 text-slate-300 border border-slate-700/50"
                  }`}
                >
                  {isMatched && <span className="mr-1 text-cyan-400 font-bold">•</span>}
                  {skill}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-500">
          Cosine Similarity: <span className="font-mono text-slate-400">{expert.score.toFixed(3)}</span>
        </span>

        {onSelect ? (
          <button
            onClick={() => onSelect(expert)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Assign Sign-off
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <a
            href={`mailto:${user.email}?subject=Project%20Atlas%20Expert%20Inquiry`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Contact Expert
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
