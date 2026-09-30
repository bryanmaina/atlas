"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  SlidersHorizontal,
  ArrowUpRight,
  Clock,
  CheckSquare,
  Paperclip,
  Image as ImageIcon,
  Mic,
  Send,
  Plus,
  FileText,
  Users,
  Palmtree,
  LogOut,
  Heart,
} from "lucide-react";
import { useCurrentUser } from "@/components/providers/UserContext";
import { DocumentCardData } from "@/components/documents/DocumentCard";
import { TrafficLight } from "@/components/documents/TrafficLight";
import { GlobalSearchModal } from "@/components/search/GlobalSearchModal";

interface EmployeeSchedule {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  leaves: Array<{
    type: "Vacation" | "Paid Leave" | "Sick Leave";
    status: "Approved" | "Pending";
    startCol: number; // 1-indexed (1 to 16)
    span: number;
    gradientClass: string;
    icon: typeof Palmtree;
  }>;
}

export default function DashboardPage() {
  const { currentUser } = useCurrentUser();
  const [documents, setDocuments] = useState<DocumentCardData[]>([]);
  const [activeTab, setActiveTab] = useState<"absences" | "verification">("absences");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    fetch("/api/documents")
      .then((res) => res.json())
      .then((data) => setDocuments(data.documents || []))
      .catch((err) => console.error("Error loading documents:", err));
  }, []);

  // Calendar dates matching reference image: Mon 1 through Tue 16
  const days = [
    { day: "Mon", date: 1, isWeekend: false },
    { day: "Tue", date: 2, isWeekend: false },
    { day: "Wed", date: 3, isWeekend: false },
    { day: "Thu", date: 4, isWeekend: false },
    { day: "Fri", date: 5, isWeekend: false },
    { day: "Sat", date: 6, isWeekend: true },
    { day: "Sun", date: 7, isWeekend: true },
    { day: "Mon", date: 8, isWeekend: false },
    { day: "Tue", date: 9, isWeekend: false, isActive: true }, // Highlighted active marker in image
    { day: "Wed", date: 10, isWeekend: false },
    { day: "Thu", date: 11, isWeekend: false },
    { day: "Fri", date: 12, isWeekend: false },
    { day: "Sat", date: 13, isWeekend: true },
    { day: "Sun", date: 14, isWeekend: true },
    { day: "Mon", date: 15, isWeekend: false },
    { day: "Tue", date: 16, isWeekend: false },
  ];

  // Employee rows matching reference image
  const employees: EmployeeSchedule[] = [
    {
      id: "emp-1",
      name: "Ethan Parker",
      role: "Software Engineer",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      leaves: [
        {
          type: "Vacation",
          status: "Approved",
          startCol: 15,
          span: 2,
          gradientClass: "bg-gradient-to-r from-emerald-400 to-teal-400 text-white shadow-[0_4px_15px_rgba(52,211,153,0.3)]",
          icon: Palmtree,
        },
      ],
    },
    {
      id: "emp-2",
      name: "Liam Carter",
      role: "UI/UX Designer",
      avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
      leaves: [
        {
          type: "Paid Leave",
          status: "Approved",
          startCol: 2,
          span: 4,
          gradientClass: "bg-gradient-to-r from-violet-400 to-fuchsia-400 text-white shadow-[0_4px_15px_rgba(167,139,250,0.3)]",
          icon: LogOut,
        },
      ],
    },
    {
      id: "emp-3",
      name: "Noah Mitchell",
      role: "Backend Developer",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      leaves: [
        {
          type: "Sick Leave",
          status: "Pending",
          startCol: 8,
          span: 4,
          gradientClass: "bg-gradient-to-r from-blue-300 to-cyan-300 text-slate-800 shadow-[0_4px_15px_rgba(147,197,253,0.4)]",
          icon: Heart,
        },
      ],
    },
    {
      id: "emp-4",
      name: "Ava Thompson",
      role: "Product Manager",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      leaves: [
        {
          type: "Vacation",
          status: "Approved",
          startCol: 1,
          span: 4,
          gradientClass: "bg-gradient-to-r from-emerald-400 to-teal-400 text-white shadow-[0_4px_15px_rgba(52,211,153,0.3)]",
          icon: Palmtree,
        },
      ],
    },
    {
      id: "emp-5",
      name: "Mia Robinson",
      role: "QA Engineer",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      leaves: [
        {
          type: "Paid Leave",
          status: "Approved",
          startCol: 15,
          span: 2,
          gradientClass: "bg-gradient-to-r from-violet-400 to-fuchsia-400 text-white shadow-[0_4px_15px_rgba(167,139,250,0.3)]",
          icon: LogOut,
        },
      ],
    },
  ];

  // Onboarding teammates matching reference image
  const onboardingMembers = [
    {
      name: "Sophia Adams",
      role: "UI/UX Designer",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
      progress: "5/10 tasks done",
    },
    {
      name: "Lucas Morgan",
      role: "Mobile Developer",
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80",
      progress: "5/10 tasks done",
    },
    {
      name: "Mason Reed",
      role: "Cloud Architect",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
      progress: "5/10 tasks done",
    },
    {
      name: "Justin Crown",
      role: "Content Designer",
      avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80",
      progress: "5/10 tasks done",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------------- */}
      {/* TOP PANEL: Planned Absences & Verification Matrix                       */}
      {/* ---------------------------------------------------------------------- */}
      <section className="bg-white rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-100 p-6">
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-medium text-slate-800">
              {activeTab === "absences" ? "Planned Absences" : "Information Verification Pipeline"}
            </h1>
            <div className="flex items-center p-1 bg-slate-100 rounded-full border border-slate-200/80">
              <button
                onClick={() => setActiveTab("absences")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  activeTab === "absences"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Absences
              </button>
              <button
                onClick={() => setActiveTab("verification")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  activeTab === "verification"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Verification
              </button>
            </div>
          </div>

          {/* Action Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:shadow-sm text-xs font-medium transition-all">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>December 15, 2026</span>
              <span className="text-[10px] text-slate-400">▾</span>
            </button>

            <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:shadow-sm text-xs font-medium transition-all">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>Filter</span>
            </button>

            <Link
              href="/documents"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:shadow-sm text-xs font-medium transition-all"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Matrix Grid: Employees + Calendar Days */}
        {activeTab === "absences" ? (
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[920px]">
              {/* Header Row */}
              <div className="grid grid-cols-[180px_repeat(16,1fr)] gap-2 mb-2 items-end">
                <div className="text-xs font-medium text-slate-400 pb-1 pl-1">
                  Employees
                </div>
                {days.map((d) => (
                  <div key={d.date} className="flex flex-col items-center">
                    <span className="text-[11px] font-medium text-slate-400">
                      {d.day}
                    </span>
                    {d.isActive ? (
                      <span className="w-7 h-7 rounded-xl bg-blue-500 text-white font-medium text-xs flex items-center justify-center shadow-sm mt-0.5">
                        {d.date}
                      </span>
                    ) : (
                      <span
                        className={`text-xs font-medium mt-0.5 ${
                          d.isWeekend ? "text-slate-400" : "text-slate-600"
                        }`}
                      >
                        {d.date}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Rows */}
              <div className="space-y-2.5 relative">
                {/* Active Column Indicator Line */}
                <div className="absolute top-0 bottom-0 left-[calc(180px+(8*calc((100%-180px)/16))+calc(calc((100%-180px)/16)/2))] w-0 border-r-2 border-dashed border-blue-400/80 pointer-events-none z-20" />

                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="grid grid-cols-[180px_repeat(16,1fr)] gap-2 items-center relative"
                  >
                    {/* Employee Card Cell */}
                    <div className="flex items-center gap-3 pr-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={emp.avatarUrl}
                        alt={emp.name}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-800 truncate">
                          {emp.name}
                        </div>
                        <div className="text-[11px] font-medium text-slate-400 truncate">
                          {emp.role}
                        </div>
                      </div>
                    </div>

                    {/* Day Grid Cells */}
                    {days.map((d) => (
                      <div
                        key={d.date}
                        className={`h-14 rounded-xl border transition-colors ${
                          d.isWeekend
                            ? "bg-diagonal-stripes border-slate-100"
                            : "bg-slate-50 border-slate-100/90"
                        }`}
                      />
                    ))}

                    {/* Floating Absence Schedule Pills */}
                    {emp.leaves.map((leave, idx) => {
                      const Icon = leave.icon;
                      // Calculate left percentage offset and width percentage
                      const leftPercent = `calc(180px + (${leave.startCol - 1} * calc((100% - 180px) / 16)) + 4px)`;
                      const widthVal = `calc((${leave.span} * calc((100% - 180px) / 16)) - 8px)`;

                      return (
                        <div
                          key={idx}
                          style={{
                            position: "absolute",
                            left: leftPercent,
                            width: widthVal,
                          }}
                          className={`top-2 bottom-2 z-10 rounded-2xl px-3.5 flex items-center justify-between text-xs font-medium ${leave.gradientClass} transition-all hover:scale-[1.01] cursor-pointer`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="truncate">{leave.type}</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs font-medium shrink-0">
                            • {leave.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Document Verification Pipeline Tab */
          <div className="space-y-3">
            <p className="text-xs font-medium text-slate-400 mb-2">
              All organizational documents require exactly two distinct user signatures to elevate status from Draft to Verified.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {documents.slice(0, 3).map((doc) => {
                const signedCount =
                  doc.verification?.signedCount ??
                  (doc.signatures?.filter((s) => s.status === "SIGNED").length || 0);
                const trafficLightState =
                  doc.verification?.trafficLight ??
                  (doc.status === "VERIFIED" || signedCount >= 2
                    ? "GREEN"
                    : signedCount === 1
                    ? "YELLOW"
                    : "RED");

                return (
                  <Link
                    key={doc.id}
                    href={`/documents/${doc.id}`}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-medium text-slate-400">
                          {doc.category}
                        </span>
                        <TrafficLight state={trafficLightState} size="sm" showLabel={false} />
                      </div>
                      <h4 className="text-sm font-medium text-slate-800 line-clamp-1">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {doc.summary || "Organizational baseline policy"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                      <span className="text-slate-400 font-medium">
                        By {doc.author.name}
                      </span>
                      <span className="font-medium text-blue-600">
                        {signedCount}/2 Signatures
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* BOTTOM SECTION: 3 Columns (Future Events, Onboarding, AI Assistant)    */}
      {/* ---------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PANEL 1: Future Events */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-100 p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-medium text-slate-800">Future Events</h2>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-all"
              >
                <span>View all</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Event 1: Active Warm Yellow Highlight */}
              <div className="bg-amber-100/70 border border-amber-200/60 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-800">
                    Tech Innovations Summit
                  </h3>
                  <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white/80 text-amber-900 border border-amber-200/60 shadow-xs">
                    • in 15 min
                  </span>
                </div>
                <p className="text-xs font-normal text-slate-600">
                  Cutting-edge AI trends
                </p>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/80 border border-amber-200/50 text-slate-700 text-[11px] font-medium">
                      <Clock className="w-3 h-3 text-slate-400" /> 14:00 - 15:00
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/80 border border-amber-200/50 text-slate-700 text-[11px] font-medium">
                      <CalendarIcon className="w-3 h-3 text-slate-400" /> December, 5
                    </span>
                  </div>

                  <div className="flex items-center -space-x-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60"
                      alt="Attendee"
                      className="w-6 h-6 rounded-full border border-white object-cover"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60"
                      alt="Attendee"
                      className="w-6 h-6 rounded-full border border-white object-cover"
                    />
                    <span className="w-6 h-6 rounded-full bg-white/90 border border-amber-200 text-slate-700 text-[10px] font-medium flex items-center justify-center">
                      8+
                    </span>
                  </div>
                </div>
              </div>

              {/* Event 2: Standard Slate Card */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2.5">
                <h3 className="text-sm font-medium text-slate-800">
                  Software Dev Meetup
                </h3>
                <p className="text-xs font-normal text-slate-500">
                  A practical session focused on modern development workflows
                </p>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-600 text-[11px] font-medium">
                      <Clock className="w-3 h-3 text-slate-400" /> 14:00 - 15:00
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-600 text-[11px] font-medium">
                      <CalendarIcon className="w-3 h-3 text-slate-400" /> December, 5
                    </span>
                  </div>

                  <div className="flex items-center -space-x-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=60"
                      alt="Attendee"
                      className="w-6 h-6 rounded-full border border-white object-cover"
                    />
                    <span className="w-6 h-6 rounded-full bg-slate-200/80 border border-white text-slate-700 text-[10px] font-medium flex items-center justify-center">
                      12+
                    </span>
                  </div>
                </div>
              </div>

              {/* Event 3: Cybersecurity Workshop */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-1.5">
                <h3 className="text-sm font-medium text-slate-800">
                  Cybersecurity Workshop
                </h3>
                <p className="text-xs font-normal text-slate-500 line-clamp-1">
                  Dive into essential security strategies, threat prevention and SOC2 compliance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL 2: Onboarding */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-100 p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-medium text-slate-800">Onboarding</h2>
              <Link
                href="/talent-map"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-all"
              >
                <span>View all</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>

            {/* 2x2 Grid of Onboarding Profile Cards */}
            <div className="grid grid-cols-2 gap-3.5">
              {onboardingMembers.map((member) => (
                <div
                  key={member.name}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col items-center text-center space-y-2 hover:bg-slate-100/60 transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-xs"
                  />
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-slate-800">
                      {member.name}
                    </h4>
                    <p className="text-xs font-medium text-slate-400">
                      {member.role}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-600 text-[11px] font-medium shadow-2xs">
                    <CheckSquare className="w-3 h-3 text-slate-400" />
                    <span>{member.progress}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PANEL 3: AI Assistant & Knowledge Hub with 3D Glass Sphere */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-100 p-6 flex flex-col justify-between space-y-4">
          <div>
            {/* 3D Glass Sphere */}
            <div className="flex justify-center mb-1">
              <div className="glass-sphere" />
            </div>

            {/* Greeting */}
            <div className="text-center space-y-1">
              <h2 className="text-xl font-medium text-slate-800">
                Welcome, {currentUser?.name?.split(" ")[0] || "Emily"}
              </h2>
              <p className="text-xs font-medium text-slate-400">
                What can I help with today?
              </p>
            </div>

            {/* Quick Action Pill Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <Link
                href="/documents/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-medium transition-all shadow-xs"
              >
                <Plus className="w-3 h-3 text-slate-400" />
                <span>Create a profile</span>
              </Link>
              <Link
                href="/documents"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-medium transition-all shadow-xs"
              >
                <FileText className="w-3 h-3 text-slate-400" />
                <span>Get reports</span>
              </Link>
              <Link
                href="/talent-map"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-medium transition-all shadow-xs"
              >
                <Users className="w-3 h-3 text-slate-400" />
                <span>Manage users</span>
              </Link>
            </div>
          </div>

          {/* Prompt / Search Input Bar */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-3 space-y-2 mt-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsSearchOpen(true);
                }
              }}
              placeholder="Ask me anything"
              maxLength={300}
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />

            <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-200/50">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attach file</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Create</span>
                </button>
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-slate-400">
                  {aiPrompt.length}/300
                </span>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="w-7 h-7 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
