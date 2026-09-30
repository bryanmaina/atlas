"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  FileText,
  Search,
  Plus,
  Bell,
  ChevronDown,
} from "lucide-react";
import { useCurrentUser } from "@/components/providers/UserContext";
import { GlobalSearchModal } from "@/components/search/GlobalSearchModal";

export function TopBar() {
  const pathname = usePathname();
  const { currentUser, users, setCurrentUser } = useCurrentUser();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const tabs = [
    { href: "/", label: "Dashboard", icon: LayoutGrid },
    { href: "/talent-map", label: "Employees", icon: Users },
    { href: "/documents", label: "Reports", icon: FileText },
  ];

  return (
    <>
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
        {/* Left Section: Pill Tabs & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 bg-white border border-slate-200/80 rounded-full shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? "bg-slate-100 text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}

            {/* Quick Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors ml-1"
              title="Search (Cmd+K)"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Section: Team Avatars Stack, Add Action, Profile Switcher & Notifications */}
        <div className="flex items-center gap-3">
          {/* Avatar stack */}
          <div className="hidden lg:flex items-center -space-x-2 mr-1">
            {users.slice(0, 3).map((u) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={u.id}
                src={u.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                alt={u.name}
                className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm"
              />
            ))}
            <span className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white text-slate-600 text-[11px] font-medium flex items-center justify-center shadow-sm">
              8+
            </span>
          </div>

          {/* Add Document / Employee Action */}
          <Link
            href="/documents/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:shadow-sm text-xs font-medium transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Document</span>
          </Link>

          {/* Active Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1 pl-1.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all"
            >
              {currentUser?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                  {currentUser?.name?.charAt(0) || "U"}
                </div>
              )}
              <span className="hidden xl:inline text-xs font-medium text-slate-700 pr-1">
                {currentUser?.name || "Select Profile"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pr-1" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-3xl bg-white border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] p-3 z-50 animate-in fade-in duration-150">
                <div className="px-3 py-2 border-b border-slate-100 mb-2">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Mock Authentication Switcher
                  </p>
                  <p className="text-xs font-medium text-slate-700">
                    Switch active profile to test role verification
                  </p>
                </div>

                <div className="space-y-1">
                  {users.map((u) => {
                    const isCurrent = u.id === currentUser?.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          setCurrentUser(u);
                          setIsProfileOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all ${
                          isCurrent
                            ? "bg-slate-50 border border-slate-200"
                            : "hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        {u.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                            {u.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-800">{u.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                              {u.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{u.department || u.skills}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-sm relative transition-all"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>
        </div>
      </header>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
