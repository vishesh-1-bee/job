"use client";

import React from "react";

export interface ProfileData {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  headline?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  website?: string | null;
  summary?: string | null;
}

export interface Skill { id: string; name: string; category: string; }
export interface WorkExperience { id: string; }
export interface Education { id: string; }
export interface Project { id: string; }
export interface Certification { id: string; }

interface ProfileCompletenessCardProps {
  profile: ProfileData | null;
  skills: Skill[];
  workExperiences: WorkExperience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
  onNavigateToSection: (sectionId: string) => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  sublabel: string;
  points: number;
  completed: boolean;
  sectionId: string;
  actionText: string;
}

export default function ProfileCompletenessCard({
  profile,
  skills,
  workExperiences,
  education,
  projects,
  certifications,
  onNavigateToSection,
}: ProfileCompletenessCardProps) {
  // 1. Calculate completeness metrics
  const hasName = !!profile?.full_name?.trim();
  const hasEmail = !!profile?.email?.trim();
  const hasHeadline = !!profile?.headline?.trim();
  const hasSummary = !!profile?.summary?.trim();
  const hasPhone = !!profile?.phone?.trim();
  const hasLocation = !!profile?.location?.trim();

  // Links count
  const links = [profile?.linkedin_url, profile?.github_url, profile?.website].filter(Boolean);
  const linksCount = links.length;

  // Skills
  const skillsCount = skills.length;

  // Work, Education, Projects/Certs
  const hasWork = workExperiences.length > 0;
  const hasEdu = education.length > 0;
  const hasProjOrCert = projects.length > 0 || certifications.length > 0;

  // 2. Define checklist items
  const items: ChecklistItem[] = [
    {
      id: "personal",
      label: "Personal Identity",
      sublabel: "Name, email and headline",
      points: 30,
      completed: hasName && hasEmail && hasHeadline,
      sectionId: "personal-info",
      actionText: "Fill Info",
    },
    {
      id: "summary",
      label: "Professional Summary",
      sublabel: "Brief summary of your background",
      points: 10,
      completed: hasSummary,
      sectionId: "professional-summary",
      actionText: "Write Summary",
    },
    {
      id: "contact",
      label: "Contact & Location",
      sublabel: "Phone number and location",
      points: 15,
      completed: hasPhone && hasLocation,
      sectionId: "personal-info",
      actionText: "Add Contact",
    },
    {
      id: "links",
      label: "Portfolio & Socials",
      sublabel: "Add at least 2 profile links",
      points: 15,
      completed: linksCount >= 2,
      sectionId: "personal-info",
      actionText: "Add Links",
    },
    {
      id: "skills",
      label: "Skills Inventory",
      sublabel: "Add at least 3 skills",
      points: 10,
      completed: skillsCount >= 3,
      sectionId: "skills-section",
      actionText: "Add Skills",
    },
    {
      id: "experience",
      label: "Work History",
      sublabel: "Add at least one role",
      points: 10,
      completed: hasWork,
      sectionId: "work-experience-section",
      actionText: "Add Experience",
    },
    {
      id: "education",
      label: "Education Background",
      sublabel: "Add school or university",
      points: 5,
      completed: hasEdu,
      sectionId: "education-section",
      actionText: "Add Education",
    },
    {
      id: "projects",
      label: "Projects & Certifications",
      sublabel: "Add project or certification",
      points: 5,
      completed: hasProjOrCert,
      sectionId: "projects-section",
      actionText: "Add Projects",
    },
  ];

  // 3. Compute detailed percentage score
  let score = 0;
  // Personal: Name (10%), Email (10%), Headline (10%)
  if (hasName) score += 10;
  if (hasEmail) score += 10;
  if (hasHeadline) score += 10;
  // Summary: 10%
  if (hasSummary) score += 10;
  // Contact: Phone (7.5%), Location (7.5%)
  if (hasPhone) score += 7.5;
  if (hasLocation) score += 7.5;
  // Links: 5% each up to 15%
  score += Math.min(linksCount * 5, 15);
  // Skills: 5% for 1-2, 10% for 3+
  if (skillsCount >= 3) {
    score += 10;
  } else if (skillsCount >= 1) {
    score += 5;
  }
  // Experience: 10%
  if (hasWork) score += 10;
  // Education: 5%
  if (hasEdu) score += 5;
  // Projects/Cert: 5%
  if (hasProjOrCert) score += 5;

  // Round score to nearest integer
  const percentage = Math.round(score);

  // SVG parameters
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Feedback text based on percentage
  let feedback = "Let's complete your profile to stand out.";
  if (percentage >= 100) {
    feedback = "Fantastic! Your profile is 100% complete.";
  } else if (percentage >= 80) {
    feedback = "Excellent! You are ready to start applying.";
  } else if (percentage >= 50) {
    feedback = "Good progress! A few more details will unlock better matches.";
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header with Circular Progress */}
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-20 h-20 transform -rotate-90">
            {/* Background ring */}
            <circle
              className="text-slate-100"
              strokeWidth="7"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="40"
              cy="40"
            />
            {/* Progress ring */}
            <circle
              className="text-[#ACF417] transition-all duration-500 ease-out"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="40"
              cy="40"
            />
          </svg>
          {/* Centered percentage text */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-base font-extrabold text-slate-800 tracking-tight">
              {percentage}%
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-800">Profile Completeness</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {feedback}
          </p>
        </div>
      </div>

      {/* Progress Bar under the header as micro-helper */}
      {percentage < 100 && (
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-[#ACF417] h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Checklist items */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Profile Checklist
        </h4>
        <div className="space-y-3.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 text-left group"
            >
              <div className="flex gap-3 min-w-0">
                {/* Status indicator icon */}
                {item.completed ? (
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : (
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 border border-slate-200">
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  </span>
                )}

                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold transition-colors ${
                      item.completed ? "text-slate-500 line-through decoration-slate-300" : "text-slate-700"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {item.sublabel}
                  </p>
                </div>
              </div>

              {/* Action Button or Points tag */}
              <div className="shrink-0 flex items-center">
                {item.completed ? (
                  <span className="text-[10px] font-bold text-slate-350 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                    +{item.points}%
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigateToSection(item.sectionId)}
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#8cc610] hover:text-[#5a8c00] hover:underline bg-slate-50 px-2 py-0.5 rounded-lg border border-[#ACF417]/30 hover:border-[#ACF417]/60 transition-all cursor-pointer"
                  >
                    {item.actionText}
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
