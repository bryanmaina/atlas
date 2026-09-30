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
          bg: "bg-violet-50 text-violet-700 border border-violet-200/60",
          icon: ShieldCheck,
        };
      case "VALIDATOR":
        return {
          label: "Technical Validator",
          bg: "bg-cyan-50 text-cyan-700 border border-cyan-200/60",
          icon: CheckCircle,
        };
      case "CONTRIBUTOR":
      default:
        return {
          label: "Contributor",
          bg: "bg-slate-100 text-slate-600 border border-slate-200/60",
          icon: Code,
        };
    }
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 85) {
      return {
        label: "Exceptional Match",
        badgeClass: "bg-gradient-to-r from-emerald-400 to-teal-400 text-white shadow-[0_4px_15px_rgba(52,211,153,0.3)]",
        barColor: "from-emerald-400 to-teal-400",
      };
    }
    if (confidence >= 70) {
      return {
        label: "High Fit",
        badgeClass: "bg-gradient-to-r from-violet-400 to-fuchsia-400 text-white shadow-[0_4px_15px_rgba(167,139,250,0.3)]",
        barColor: "from-violet-400 to-fuchsia-400",
      };
    }
    return {
      label: "Capable Match",
      badgeClass: "bg-gradient-to-r from-blue-300 to-cyan-300 text-slate-800 shadow-[0_4px_15px_rgba(147,197,253,0.4)]",
      barColor: "from-blue-300 to-cyan-300",
    };
  };

  const roleBadge = getRoleBadge(user.role);
  const confidenceMeta = getConfidenceLevel(matchConfidence);
  const RoleIcon = roleBadge.icon;

  return (
    <div className="bg-white rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-100 p-6 flex flex-col justify-between hover:shadow-[0_14px_35px_-6px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all">
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
                  className="rounded-full object-cover ring-2 ring-slate-100"
                />
              ) : (
                <div className="w-13 h-13 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg">
                  {user.name.charAt(0)}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            <div>
              <h3 className="text-base font-medium text-slate-800">
                {user.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${roleBadge.bg}`}
                >
                  <RoleIcon className="w-3 h-3" />
                  {roleBadge.label}
                </span>
              </div>
            </div>
          </div>

          {/* Match Confidence Score Pill */}
          <div
            className={`flex flex-col items-end px-3.5 py-1.5 rounded-2xl ${confidenceMeta.badgeClass}`}
          >
            <div className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-base font-semibold tracking-tight">
                {matchConfidence}%
              </span>
            </div>
            <span className="text-[10px] font-medium opacity-90">
              {confidenceMeta.label}
            </span>
          </div>
        </div>

        {/* Confidence Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${confidenceMeta.barColor} transition-all duration-700`}
            style={{ width: `${matchConfidence}%` }}
          />
        </div>

        {/* Metadata: Department & Email */}
        <div className="space-y-1.5 text-xs text-slate-500 mb-4">
          {user.department && (
            <div className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>{user.department}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600 truncate">{user.email}</span>
          </div>
        </div>

        {/* Match Reasoning Quote */}
        {matchReasoning && (
          <div className="mb-4 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 italic">
            &ldquo;{matchReasoning}&rdquo;
          </div>
        )}

        {/* Skills Section */}
        <div className="space-y-2 mb-4">
          <div className="text-xs font-medium text-slate-400">
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
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                    isMatched
                      ? "bg-blue-50 text-blue-700 border border-blue-200/80 font-medium"
                      : "bg-slate-50 text-slate-600 border border-slate-200/60"
                  }`}
                >
                  {isMatched && <span className="mr-1 text-blue-500 font-bold">•</span>}
                  {skill}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-400">
          Cosine Similarity: <span className="font-mono text-slate-600 font-medium">{expert.score.toFixed(3)}</span>
        </span>

        {onSelect ? (
          <button
            onClick={() => onSelect(expert)}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Assign Sign-off
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <a
            href={`mailto:${user.email}?subject=Project%20Atlas%20Expert%20Inquiry`}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Contact Expert
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
