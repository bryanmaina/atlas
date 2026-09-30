"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Network,
  FileText,
  BarChart2,
  Sparkles,
  Settings,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/talent-map", label: "Talent Map", icon: Network },
    { href: "/documents", label: "Documents", icon: FileText },
    { href: "/signatures", label: "Compliance & Audit", icon: BarChart2 },
  ];

  return (
    <aside className="w-full md:w-16 flex md:flex-col items-center justify-between gap-6 py-2 px-1 flex-shrink-0">
      {/* Top Brand Logo */}
      <div className="flex md:flex-col items-center gap-6">
        <Link
          href="/"
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white shadow-[0_8px_20px_rgba(59,130,246,0.3)] hover:scale-105 transition-transform"
          title="Project Atlas"
        >
          <div className="flex items-center gap-1 font-bold text-lg tracking-tighter">
            <span>h</span>
            <span className="w-2 h-2 rounded-full bg-white mb-2" />
          </div>
        </Link>

        {/* Vertical Icon List */}
        <nav className="flex md:flex-col items-center gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-slate-100 text-slate-800 shadow-sm border border-slate-200"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-5 h-5" />
              </Link>
            );
          })}

          {/* AI Trigger */}
          <Link
            href="/#assistant"
            title="AI Knowledge Assistant"
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
          >
            <Sparkles className="w-5 h-5" />
          </Link>
        </nav>
      </div>

      {/* Bottom Settings Button */}
      <div className="hidden md:flex flex-col items-center">
        <button
          type="button"
          title="Settings & Configuration"
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
