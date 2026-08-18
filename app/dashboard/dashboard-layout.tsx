"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import SignOutButton from "./sign-out-button";
import OnboardingDialog from "@/components/onboarding-dialog";

interface Profile {
  full_name?: string | null;
  has_resume?: boolean | null;
  [key: string]: any;
}

interface DashboardLayoutProps {
  user: {
    id: string;
    email?: string;
    [key: string]: any;
  };
  profile: Profile | null;
  hasResume: boolean;
  children: React.ReactNode;
}

export default function DashboardLayout({
  user,
  profile,
  hasResume,
  children,
}: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!hasResume);
  const pathname = usePathname();

  const displayName = profile?.full_name || user.email?.split("@")[0] || "User";
  const userEmail = user.email || "";

  const navItems = [
    {
      href: "/dashboard",
      name: "Jobs",
      exact: true,
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: "/dashboard/resume",
      name: "Resume",
      exact: false,
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      href: "/dashboard/profile",
      name: "Profile",
      exact: false,
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      href: "/dashboard/status",
      name: "Application Status",
      exact: false,
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
        </svg>
      ),
    },
  ];

  const footerItems = [
    {
      href: "/dashboard/billing",
      name: "Billing / Credits",
      exact: false,
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      href: "/dashboard/settings",
      name: "Profile Settings",
      exact: false,
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const getPageTitle = () => {
    const allItems = [...navItems, ...footerItems];
    const match = allItems.find((item) =>
      item.exact ? pathname === item.href : pathname.startsWith(item.href)
    );
    return match?.name || "Dashboard";
  };

  return (
    <>
      {/* Non-closable onboarding dialog for new users */}
      {showOnboarding && (
        <OnboardingDialog
          userId={user.id}
          userEmail={userEmail}
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 antialiased w-full">
        {/* Sidebar */}
        <aside
          className={cn(
            "bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 ease-in-out select-none z-30 shrink-0 h-screen sticky top-0",
            isCollapsed ? "w-20" : "w-64"
          )}
        >
          <div className="flex flex-col overflow-y-auto no-scrollbar flex-1">
            {/* Logo */}
            <div
              className={cn(
                "flex items-center gap-3 p-5 border-b border-slate-100 h-16 shrink-0",
                isCollapsed ? "justify-center" : "justify-start"
              )}
            >
              <div className="h-9 w-9 rounded-lg bg-[#ACF417] flex items-center justify-center font-bold text-slate-900 shadow-sm shrink-0">
                JB
              </div>
              {!isCollapsed && (
                <span className="font-bold text-lg text-slate-900 tracking-tight whitespace-nowrap animate-in fade-in duration-200">
                  JobBuddy AI
                </span>
              )}
            </div>

            {/* Nav */}
            <nav className="p-3 space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group",
                      active
                        ? "bg-[#ACF417]/15 text-slate-900"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    {item.icon}
                    {!isCollapsed && (
                      <span className="whitespace-nowrap transition-opacity duration-200">
                        {item.name}
                      </span>
                    )}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 shadow-md">
                        {item.name}
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Footer */}
          <div className="p-3 flex flex-col gap-4 border-t border-slate-100 shrink-0">
            {/* Credits */}
            <div className={cn("transition-all duration-300 ease-in-out", isCollapsed ? "px-1" : "px-0")}>
              {isCollapsed ? (
                <div className="group relative flex flex-col items-center justify-center p-3 rounded-xl bg-[#ACF417]/10 border border-[#ACF417]/20 text-[#8cc610] cursor-pointer hover:bg-[#ACF417]/20 transition-all">
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[10px] font-extrabold mt-1 text-slate-850">150</span>
                  <div className="absolute left-full bottom-0 ml-3 p-3 bg-white text-slate-800 text-xs rounded-xl pointer-events-none group-hover:opacity-100 opacity-0 transition-opacity duration-200 border border-slate-200 shadow-xl z-50 min-w-48">
                    <div className="font-semibold text-slate-900 mb-1">Credits Remaining</div>
                    <div className="text-base font-extrabold text-slate-800 mb-1.5">150 / 200</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#ACF417] h-full" style={{ width: "75%" }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#ACF417]/10 border border-[#ACF417]/20 flex flex-col gap-3 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Credits remaining</span>
                      <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                        150 <span className="text-slate-400 font-normal text-sm">/ 200</span>
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#ACF417]/20 text-slate-800">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200/60 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-[#ACF417] h-full rounded-full transition-all duration-500" style={{ width: "75%" }} />
                  </div>
                  <Link href="/dashboard/billing" className="text-xs font-semibold text-slate-650 hover:text-slate-900 text-left hover:underline focus:outline-none">
                    Manage billing and credits
                  </Link>
                </div>
              )}
            </div>

            {/* Footer Nav */}
            <div className="space-y-1">
              {footerItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group",
                      active
                        ? "bg-[#ACF417]/15 text-slate-900"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    {item.icon}
                    {!isCollapsed && (
                      <span className="whitespace-nowrap transition-opacity duration-200">{item.name}</span>
                    )}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 shadow-md">
                        {item.name}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50 h-screen overflow-hidden">
          {/* Top Header */}
          <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 shadow-sm cursor-pointer"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h16" />
                </svg>
              </button>
              <h1 className="font-bold text-slate-800 text-base md:text-lg tracking-tight select-none">
                {getPageTitle()}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-800">{displayName}</span>
                <span className="text-xs text-slate-400 select-all">{userEmail}</span>
              </div>
              <div className="h-9 w-9 rounded-full bg-[#ACF417]/20 border border-[#ACF417]/30 flex items-center justify-center text-xs font-bold text-slate-800 shadow-sm select-none">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <SignOutButton />
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
