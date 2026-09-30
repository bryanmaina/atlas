"use client";

import React, { useState, useTransition } from "react";
import {
  Sparkles,
  Cpu,
  ArrowRight,
  RefreshCw,
  Tag,
  CheckCircle2,
  FileText,
  AlertCircle,
} from "lucide-react";
import { extractSkillsAction } from "@/app/actions/talent";

interface SkillExtractionCardProps {
  onSkillsExtracted: (skills: string[]) => void;
  onQueryChange?: (skillQuery: string) => void;
}

const SAMPLE_DESCRIPTIONS = [
  {
    title: "Cloud Infrastructure Specialist",
    text: "Architected fault-tolerant microservices running on Kubernetes and Google Cloud Run. Developed backend REST services in Go, integrated Prometheus telemetry, and managed container deployment pipelines using Docker and Helm.",
  },
  {
    title: "Frontend Systems Engineer",
    text: "Engineered high-performance React 19 web applications with Next.js App Router and TypeScript. Optimized Core Web Vitals (LCP, INP) through server-side rendering, crafted responsive UI components using Tailwind CSS, and authored comprehensive technical documentation.",
  },
  {
    title: "Enterprise Security & Governance Lead",
    text: "Led corporate zero-trust access control implementations and SOC 2 Type II compliance audits. Conducted cloud architecture threat modeling, managed organizational cryptographic standards, and orchestrated executive sign-off procedures across engineering teams.",
  },
];

export function SkillExtractionCard({
  onSkillsExtracted,
  onQueryChange,
}: SkillExtractionCardProps) {
  const [workDescription, setWorkDescription] = useState(
    SAMPLE_DESCRIPTIONS[0].text
  );
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [extractionMethod, setExtractionMethod] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleExtract = () => {
    if (!workDescription.trim()) return;

    setError(null);
    startTransition(async () => {
      try {
        const res = await extractSkillsAction(workDescription);
        if (res.success && res.skills.length > 0) {
          setExtractedSkills(res.skills);
          setExtractionMethod(res.extractionMethod);
          onSkillsExtracted(res.skills);
          if (onQueryChange) {
            onQueryChange(res.skills.slice(0, 3).join(", "));
          }
        } else {
          setError(res.error || "No technical skills could be extracted.");
        }
      } catch (err) {
        console.error("Extraction error:", err);
        setError("An error occurred during skill extraction.");
      }
    });
  };

  const handleSampleClick = (sampleText: string) => {
    setWorkDescription(sampleText);
    setError(null);
  };

  const handleSkillClick = (skill: string) => {
    if (onQueryChange) {
      onQueryChange(skill);
    }
  };

  return (
    <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-indigo-500/20 shadow-2xl relative overflow-hidden">
      {/* Background glow element */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Next.js Server Action</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Work Description Skill Extractor
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Extract core technical competencies from an employee&apos;s project logs or resume, then match against the User database.
            </p>
          </div>

          {/* Extraction Engine Indicator */}
          {extractionMethod && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs text-slate-300">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>
                Engine:{" "}
                <strong className="text-white font-semibold capitalize">
                  {extractionMethod === "gemini-api" ? "Gemini Flash API" : "Deterministic Local NLP"}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Preset Sample Templates */}
        <div className="mb-4">
          <span className="text-xs font-medium text-slate-400 mr-2 flex items-center gap-1 mb-2">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            Quick Presets:
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_DESCRIPTIONS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSampleClick(preset.text)}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input */}
        <div className="relative mb-4">
          <textarea
            value={workDescription}
            onChange={(e) => setWorkDescription(e.target.value)}
            rows={4}
            placeholder="Paste an employee's work description, project summary, or resume achievements..."
            className="w-full glass-input rounded-2xl p-4 text-sm focus:outline-none resize-none placeholder:text-slate-500"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleExtract}
            disabled={isPending || !workDescription.trim()}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Extracting Skills (Server Action)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Extract Core Skills (Server Action)</span>
              </>
            )}
          </button>

          {extractedSkills.length > 0 && (
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                <strong>{extractedSkills.length}</strong> competencies extracted
              </span>
            </span>
          )}
        </div>

        {/* Extracted Skills Badges */}
        {extractedSkills.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-800/80 animate-in fade-in duration-300">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              <span>Extracted Core Skills (Click to query experts)</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {extractedSkills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => handleSkillClick(skill)}
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-200 text-xs font-medium transition-all hover:scale-105 active:scale-95"
                >
                  <span>{skill}</span>
                  <ArrowRight className="w-3 h-3 text-cyan-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
