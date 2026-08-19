"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import JobCard, { Job } from "@/components/job-card";
import JobCardSkeleton from "@/components/job-card-skeleton";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Platform {
  id: string;
  label: string;
  logo: string;
  logoClass?: string;
  description: string;
  accent: string;
  selectedBg: string;
  selectedBorder: string;
}

// ── Platform definitions ──────────────────────────────────────────────────────

const PLATFORMS: Platform[] = [
  {
    id: "greenhouse",
    label: "Greenhouse",
    logo: "/greenhouse.png",
    description: "Top tech companies",
    accent: "text-emerald-600",
    selectedBg: "bg-emerald-50",
    selectedBorder: "border-emerald-400",
  },
  {
    id: "lever",
    label: "Lever",
    logo: "/lever.png",
    description: "Fast-growing startups",
    accent: "text-blue-600",
    selectedBg: "bg-blue-50",
    selectedBorder: "border-blue-400",
  },
  {
    id: "workable",
    label: "Workable",
    logo: "/workable.jpg",
    description: "Global opportunities",
    accent: "text-violet-600",
    selectedBg: "bg-violet-50",
    selectedBorder: "border-violet-400",
  },
  {
    id: "wellfound",
    label: "Wellfound",
    logo: "/wellfound-symbol-white.png",
    logoClass: "bg-slate-900 rounded-md p-0.5",
    description: "Startup & equity roles",
    accent: "text-slate-700",
    selectedBg: "bg-slate-100",
    selectedBorder: "border-slate-500",
  },
];

// ── Recent Activity mock ──────────────────────────────────────────────────────

const RECENT_ACTIVITY = [
  { icon: "🔍", text: "Jobs refreshed from Greenhouse", time: "Just now" },
  { icon: "💾", text: "Saved Frontend role at Stripe", time: "2h ago" },
  { icon: "✅", text: "Applied to Vercel via Lever", time: "Yesterday" },
  { icon: "📄", text: "Resume updated", time: "2 days ago" },
];

// ── Sidebar: Profile Completeness mini ───────────────────────────────────────

function ProfileMiniCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Profile Completeness</h3>
        <Link
          href="/dashboard/profile"
          className="text-[11px] font-semibold text-[#6a9c00] hover:underline"
        >
          Edit →
        </Link>
      </div>

      {/* Ring */}
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle className="text-slate-100" strokeWidth="6" stroke="currentColor" fill="transparent" r="28" cx="32" cy="32" />
            <circle
              className="text-[#ACF417] transition-all duration-700"
              strokeWidth="6"
              strokeDasharray={2 * Math.PI * 28}
              strokeDashoffset={2 * Math.PI * 28 * (1 - 0.72)}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="28"
              cx="32"
              cy="32"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-sm font-extrabold text-slate-800">72%</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {[
            { label: "Personal Info", done: true },
            { label: "Work Experience", done: true },
            { label: "Skills", done: true },
            { label: "Projects", done: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={cn("h-2 w-2 rounded-full shrink-0", item.done ? "bg-[#ACF417]" : "bg-slate-200")} />
              <span className={cn("text-[11px]", item.done ? "text-slate-600" : "text-slate-400")}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#ACF417]/10 border border-[#ACF417]/20 rounded-xl p-3">
        <p className="text-[11px] text-slate-700 leading-relaxed">
          Complete your profile to get <span className="font-bold text-slate-900">better job matches</span> and increase visibility.
        </p>
        <Link href="/dashboard/profile" className="mt-2 block text-[11px] font-bold text-[#6a9c00] hover:underline">
          Complete Profile →
        </Link>
      </div>
    </div>
  );
}

// ── Sidebar: Recent Activity ──────────────────────────────────────────────────

function RecentActivityCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <h3 className="text-sm font-bold text-slate-800">Recent Activity</h3>
      <div className="space-y-3">
        {RECENT_ACTIVITY.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-base leading-none mt-0.5">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-700 leading-relaxed">{item.text}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ onFetch }: { onFetch: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-slate-800">No jobs found</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-xs">
        Select at least one platform above and click &quot;Find Jobs&quot; to discover matches.
      </p>
      <button
        onClick={onFetch}
        className="mt-5 px-5 py-2.5 bg-[#ACF417] hover:bg-[#9cde0f] text-slate-900 font-bold text-sm rounded-xl transition-colors shadow-sm"
      >
        Find Jobs
      </button>
    </div>
  );
}

// ── Error State ───────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-slate-800">Something went wrong</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-xs">{message}</p>
      <button
        onClick={onRetry}
        className="mt-5 px-5 py-2.5 bg-[#ACF417] hover:bg-[#9cde0f] text-slate-900 font-bold text-sm rounded-xl transition-colors shadow-sm"
      >
        Try Again
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const ALL_PLATFORM_IDS = ["greenhouse", "lever", "workable", "wellfound"];

export default function JobsDashboardPage() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(ALL_PLATFORM_IDS);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const fetchJobs = useCallback(async (forceRefresh = false, platformOverride?: string[]) => {
    const platforms = platformOverride ?? selectedPlatforms;
    if (platforms.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/jobs/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platforms, forceRefresh }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch jobs");
      }

      const data = await res.json();
      setJobs(data.jobs || []);
      setHasFetched(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, [selectedPlatforms]);

  // Auto-fetch on mount with ALL 4 platforms
  useEffect(() => {
    fetchJobs(false, ALL_PLATFORM_IDS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveToggle = (jobId: string, saved: boolean) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, saved_status: saved } : j))
    );
  };

  // Filtered jobs
  const displayJobs = jobs.filter((j) => {
    if (filter === "saved") return j.saved_status;
    if (filter === "applied") return j.applied_status;
    if (filter !== "all") return j.platform === filter;
    return true;
  });

  const savedCount = jobs.filter((j) => j.saved_status).length;
  const topMatch = jobs.length > 0 ? Math.max(...jobs.map((j) => j.match_score || 0)) : 0;

  return (
    <div className="min-h-full">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 mb-6 relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute -top-8 -right-8 h-40 w-40 bg-[#ACF417]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-4 right-1/3 h-24 w-24 bg-[#ACF417]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-lg bg-[#ACF417] flex items-center justify-center">
                <svg className="h-3.5 w-3.5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-[#ACF417] text-xs font-bold uppercase tracking-widest">AI Job Matching</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white leading-tight">
              Your Top Job Matches
            </h1>
            <p className="text-sm text-slate-400 mt-1.5 max-w-lg">
              AI-curated roles matched to your skills and experience across the top platforms. Results are cached for 6 hours.
            </p>

            {hasFetched && jobs.length > 0 && (
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[#ACF417] animate-pulse" />
                  <span className="text-xs text-slate-300">{jobs.length} matches found</span>
                </div>
                {topMatch > 0 && (
                  <span className="text-xs text-slate-300">
                    Top match: <span className="text-[#ACF417] font-bold">{topMatch}%</span>
                  </span>
                )}
                {savedCount > 0 && (
                  <span className="text-xs text-slate-300">
                    <span className="text-amber-400 font-bold">{savedCount}</span> saved
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => fetchJobs(true)}
            disabled={loading || selectedPlatforms.length === 0}
            className={cn(
              "shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm",
              loading || selectedPlatforms.length === 0
                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                : "bg-[#ACF417] hover:bg-[#9cde0f] text-slate-900"
            )}
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Searching…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Jobs
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main layout: left content + right sidebar */}
      <div className="flex gap-6 items-start">
        {/* Left column */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Platform Cards */}
          <div>
            <h2 className="text-sm font-bold text-slate-700 mb-3">Select Job Platforms</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PLATFORMS.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={cn(
                      "relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer group",
                      isSelected
                        ? `${platform.selectedBg} ${platform.selectedBorder} shadow-sm`
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    )}
                  >
                    {/* Checkmark */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[#ACF417] flex items-center justify-center shadow-sm">
                        <svg className="h-3 w-3 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}

                    <div className={cn("h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center border border-slate-100 shadow-sm", platform.id === "wellfound" ? "bg-slate-900" : "bg-white")}>
                      <Image
                        src={platform.logo}
                        alt={platform.label}
                        width={40}
                        height={40}
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <div className="text-center">
                      <p className={cn("text-xs font-bold", isSelected ? platform.accent : "text-slate-700")}>
                        {platform.label}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{platform.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedPlatforms.length === 0 && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                Select at least one platform to fetch jobs.
              </p>
            )}
          </div>

          {/* Filter tabs */}
          {hasFetched && jobs.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: "all", label: `All (${jobs.length})` },
                { id: "saved", label: `Saved (${savedCount})` },
                ...PLATFORMS.filter((p) => selectedPlatforms.includes(p.id)).map((p) => ({
                  id: p.id,
                  label: `${p.label} (${jobs.filter((j) => j.platform === p.id).length})`,
                })),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all",
                    filter === tab.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Jobs Grid */}
          <div>
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <JobCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <ErrorState message={error} onRetry={() => fetchJobs()} />
            ) : !hasFetched || jobs.length === 0 ? (
              <EmptyState onFetch={() => fetchJobs()} />
            ) : displayJobs.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-slate-500">No jobs match this filter.</p>
                <button
                  onClick={() => setFilter("all")}
                  className="mt-3 text-xs font-semibold text-[#6a9c00] hover:underline"
                >
                  Clear filter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {displayJobs.map((job) => (
                  <JobCard key={job.id} job={job} onSaveToggle={handleSaveToggle} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden xl:flex flex-col gap-4 w-72 shrink-0">
          <ProfileMiniCard />
          <RecentActivityCard />

          {/* Quick tip */}
          <div className="bg-gradient-to-br from-[#ACF417]/10 to-[#ACF417]/5 border border-[#ACF417]/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">💡</span>
              <span className="text-xs font-bold text-slate-800">Pro Tip</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Jobs are cached for <strong>6 hours</strong>. Hit &quot;Refresh Jobs&quot; to pull fresh listings from all selected platforms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
