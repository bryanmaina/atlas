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
    <div className="bg-white rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Next.js Server Action</span>
          </div>
          <h2 className="text-2xl font-medium text-slate-800">
            Work Description Skill Extractor
          </h2>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Extract core technical competencies from an employee&apos;s project logs or resume, then match against the User database.
          </p>
        </div>

        {/* Extraction Engine Indicator */}
        {extractionMethod && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <Cpu className="w-4 h-4 text-blue-500" />
            <span>
              Engine:{" "}
              <strong className="text-slate-800 font-medium capitalize">
                {extractionMethod === "gemini-api" ? "Gemini Flash API" : "Deterministic Local NLP"}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Preset Sample Templates */}
      <div>
        <span className="text-xs font-medium text-slate-400 mr-2 flex items-center gap-1 mb-2">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          Quick Presets:
        </span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_DESCRIPTIONS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSampleClick(preset.text)}
              className="text-xs px-3.5 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-medium transition-colors"
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Text Input */}
      <div>
        <textarea
          value={workDescription}
          onChange={(e) => setWorkDescription(e.target.value)}
          rows={4}
          placeholder="Paste an employee's work description, project summary, or resume achievements..."
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none placeholder:text-slate-400"
        />
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleExtract}
          disabled={isPending || !workDescription.trim()}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-white font-medium text-xs shadow-[0_4px_15px_rgba(52,211,153,0.3)] hover:opacity-95 transition-all disabled:opacity-50"
        >
          {isPending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Extracting Skills (Server Action)...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Extract Core Skills (Server Action)</span>
            </>
          )}
        </button>

        {extractedSkills.length > 0 && (
          <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>
              <strong>{extractedSkills.length}</strong> competencies extracted
            </span>
          </span>
        )}
      </div>

      {/* Extracted Skills Badges */}
      {extractedSkills.length > 0 && (
        <div className="pt-6 border-t border-slate-100">
          <div className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-blue-500" />
            <span>Extracted Core Skills (Click to query experts)</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {extractedSkills.map((skill) => (
              <button
                key={skill}
                onClick={() => handleSkillClick(skill)}
                className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200/60 text-blue-700 text-xs font-medium transition-all"
              >
                <span>{skill}</span>
                <ArrowRight className="w-3 h-3 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
