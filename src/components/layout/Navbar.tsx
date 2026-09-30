"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  FileText,
  Search,
  CheckSquare,
  Users,
  Plus,
  ChevronDown,
} from "lucide-react";
import { useCurrentUser } from "@/components/providers/UserContext";
import { GlobalSearchModal } from "@/components/search/GlobalSearchModal";

export function Navbar() {
  const pathname = usePathname();
  const { currentUser, users, setCurrentUser } = useCurrentUser();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Keyboard shortcut for Cmd+K / Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navLinks = [
    { href: "/", label: "Dashboard", icon: Compass },
    { href: "/documents", label: "Documents", icon: FileText },
    { href: "/signatures", label: "Compliance & Signatures", icon: CheckSquare },
    { href: "/talent-map", label: "Talent Map", icon: Users },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Project Atlas
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    PoC
                  </span>
                </span>
                <span className="block text-[10px] text-slate-400 font-medium">
                  Knowledge & Compliance
                </span>
              </div>
            </Link>

            {/* Nav items */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Global Semantic Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/40 transition-all shadow-inner"
            >
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Semantic Search...</span>
              <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded">
                ⌘K
              </kbd>
            </button>

            {/* New Document Button */}
            <Link
              href="/documents/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-md shadow-indigo-600/25 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Draft Doc</span>
            </Link>

            {/* User Persona Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800/60 transition-all"
              >
                {currentUser?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-indigo-500/40"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-indigo-900/60 text-indigo-300 flex items-center justify-center font-bold text-xs">
                    {currentUser?.name?.charAt(0) || "U"}
                  </div>
                )}
                <div className="hidden lg:block text-left mr-1">
                  <div className="text-xs font-semibold text-slate-200 leading-tight flex items-center gap-1.5">
                    {currentUser?.name || "Select User"}
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                        currentUser?.role === "ADMIN"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : currentUser?.role === "VALIDATOR"
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {currentUser?.role || "GUEST"}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                    {currentUser?.skills?.split(",")[0] || currentUser?.department}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Persona Switcher Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-84 rounded-2xl glass-panel border border-slate-700 shadow-2xl p-2.5 z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-2 border-b border-slate-800 mb-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Mock Authentication Provider
                    </p>
                    <p className="text-xs text-slate-300">
                      Switch active profile to test role-based validation &amp; IDOR safeguards
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    {users.map((u) => {
                      const isCurrent = u.id === currentUser?.id;
                      const role = u.role.toUpperCase();
                      const authorityText =
                        role === "ADMIN"
                          ? "Auth: LEVEL_1, 2, 3 (Full Executive)"
                          : role === "VALIDATOR"
                          ? "Auth: LEVEL_1, 2 (Technical Review)"
                          : "Auth: LEVEL_1 (Peer Review Only)";

                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            setCurrentUser(u);
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all ${
                            isCurrent
                              ? "bg-indigo-600/20 border border-indigo-500/50 text-white shadow-md"
                              : "hover:bg-slate-800/70 text-slate-300 hover:text-white border border-transparent"
                          }`}
                        >
                          {u.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={u.avatarUrl}
                              alt={u.name}
                              className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700 mt-0.5"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs mt-0.5">
                              {u.name.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-xs font-bold text-slate-100">{u.name}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                                  role === "ADMIN"
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                    : role === "VALIDATOR"
                                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                    : "bg-slate-800 text-slate-300 border border-slate-700"
                                }`}
                              >
                                {role}
                              </span>
                            </div>

                            <p className="text-[10px] text-indigo-300 font-mono mb-1">
                              {authorityText}
                            </p>

                            <p className="text-[10px] text-slate-400 line-clamp-1">
                              <strong className="text-slate-300">Skills:</strong> {u.skills}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
