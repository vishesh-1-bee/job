"use client";

import React, { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface Job {
  id: string;
  platform: string;
  title: string | null;
  company: string | null;
  company_logo: string | null;
  location: string | null;
  salary: string | null;
  job_type: string | null;
  experience_level: string | null;
  description: string | null;
  tags: string[];
  match_score: number;
  job_url: string | null;
  applied_status: boolean;
  saved_status: boolean;
  fetched_at: string;
}

const PLATFORM_CONFIG: Record<string, { label: string; bg: string; text: string; logo: string }> = {
  greenhouse: { label: "Greenhouse", bg: "bg-emerald-50", text: "text-emerald-700", logo: "/greenhouse.png" },
  lever: { label: "Lever", bg: "bg-blue-50", text: "text-blue-700", logo: "/lever.png" },
  workable: { label: "Workable", bg: "bg-violet-50", text: "text-violet-700", logo: "/workable.jpg" },
  wellfound: { label: "Wellfound", bg: "bg-slate-800", text: "text-white", logo: "/wellfound-symbol-white.png" },
};

const JOB_TYPE_COLOR: Record<string, string> = {
  "Full-time": "bg-[#ACF417]/15 text-[#4a6b00]",
  "Part-time": "bg-amber-50 text-amber-700",
  "Contract": "bg-orange-50 text-orange-700",
  "Internship": "bg-pink-50 text-pink-700",
};

const EXP_COLOR: Record<string, string> = {
  Entry: "bg-sky-50 text-sky-700",
  Mid: "bg-indigo-50 text-indigo-700",
  Senior: "bg-purple-50 text-purple-700",
  Principal: "bg-rose-50 text-rose-700",
  Internship: "bg-pink-50 text-pink-700",
};

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-[#6a9c00]";
  if (score >= 40) return "text-amber-600";
  return "text-slate-400";
}

function scoreBarColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-[#ACF417]";
  if (score >= 40) return "bg-amber-400";
  return "bg-slate-300";
}

function CompanyAvatar({ name, logo }: { name: string; logo: string | null }) {
  const [imgError, setImgError] = useState(false);
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (logo && !imgError) {
    return (
      <div className="h-12 w-12 rounded-xl border border-slate-100 bg-white flex items-center justify-center overflow-hidden shadow-sm shrink-0">
        <Image
          src={logo}
          alt={name}
          width={48}
          height={48}
          className="object-contain w-full h-full"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  const colors = [
    "bg-violet-100 text-violet-700",
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-rose-100 text-rose-700",
    "bg-amber-100 text-amber-700",
  ];
  const color = colors[(initials.charCodeAt(0) || 0) % colors.length];

  return (
    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border border-white/50", color)}>
      {initials}
    </div>
  );
}

interface JobCardProps {
  job: Job;
  onSaveToggle: (jobId: string, saved: boolean) => void;
}

export default function JobCard({ job, onSaveToggle }: JobCardProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(job.saved_status);

  const platform = PLATFORM_CONFIG[job.platform] || {
    label: job.platform,
    bg: "bg-slate-50",
    text: "text-slate-700",
    logo: null,
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const newSaved = !saved;
    setSaved(newSaved); // optimistic

    try {
      const res = await fetch("/api/jobs/save", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, saved: newSaved }),
      });
      if (!res.ok) setSaved(!newSaved); // rollback
      else onSaveToggle(job.id, newSaved);
    } catch {
      setSaved(!newSaved); // rollback
    } finally {
      setSaving(false);
    }
  };

  const score = job.match_score || 0;
  const tags: string[] = Array.isArray(job.tags)
    ? job.tags
    : typeof job.tags === "string"
    ? JSON.parse(job.tags as unknown as string)
    : [];

  return (
    <div className="group bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <CompanyAvatar name={job.company || "?"} logo={job.company_logo} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm leading-snug truncate pr-2">
                {job.title || "Untitled Role"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{job.company || "Unknown Company"}</p>
            </div>
            {/* Platform badge */}
            <span className={cn("shrink-0 flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg border", platform.bg, platform.text, job.platform === "wellfound" ? "border-slate-700" : "border-transparent")}>
              <div className={cn("relative h-3.5 w-3.5 rounded overflow-hidden", job.platform === "wellfound" ? "bg-slate-700" : "bg-transparent")}>
                <Image
                  src={platform.logo}
                  alt={platform.label}
                  fill
                  className="object-contain"
                />
              </div>
              {platform.label}
            </span>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            {job.location && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {job.location}
              </span>
            )}
            {job.salary && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {job.salary}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {job.job_type && (
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", JOB_TYPE_COLOR[job.job_type] || "bg-slate-100 text-slate-600")}>
            {job.job_type}
          </span>
        )}
        {job.experience_level && (
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", EXP_COLOR[job.experience_level] || "bg-slate-100 text-slate-600")}>
            {job.experience_level}
          </span>
        )}
        {tags.slice(0, 4).map((tag) => (
          <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {tag}
          </span>
        ))}
      </div>

      {/* Match score */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500">Match Score</span>
          <span className={cn("text-sm font-extrabold", scoreColor(score))}>{score}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", scoreBarColor(score))}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Description snippet */}
      {job.description && (
        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
          {job.description}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <a
          href={job.job_url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 bg-[#ACF417] hover:bg-[#9cde0f] text-slate-900 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Apply Now
        </a>

        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all border",
            saved
              ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800"
          )}
        >
          <svg
            className={cn("h-3.5 w-3.5 transition-all", saving && "animate-pulse")}
            fill={saved ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
