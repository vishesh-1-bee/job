"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ProfileCompletenessCard from "@/components/profile-completeness-card";

interface Profile {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  headline?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  website?: string | null;
  summary?: string | null;
  [key: string]: any;
}

interface Skill { id: string; name: string; category: string; }
interface WorkExperience {
  id: string; company_name: string; job_title: string;
  start_date: string; end_date: string; is_current: boolean;
  location: string; responsibilities: string[];
}
interface Education {
  id: string; institution: string; degree: string;
  field_of_study: string; start_date: string; end_date: string;
  gpa: string; description: string;
}
interface Project {
  id: string; name: string; description: string;
  technologies: string[]; project_url: string; github_url: string;
  start_date: string; end_date: string;
}
interface Certification {
  id: string; name: string; issuer: string;
  issue_date: string; expiry_date: string; credential_url: string;
}

interface ProfilePageClientProps {
  userId: string;
  profile: Profile | null;
  skills: Skill[];
  workExperiences: WorkExperience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
}

interface SectionProps {
  id?: string;
  title: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

// Reusable collapsible section
function Section({
  id, title, children, open: controlledOpen, onOpenChange, defaultOpen = true,
}: SectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;

  return (
    <div
      id={id}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <span className="text-base font-semibold text-slate-800">{title}</span>
        <svg
          className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
      {isOpen && <div className="px-6 pb-6 border-t border-slate-100">{children}</div>}
    </div>
  );
}

function InputField({
  label, value, onChange, placeholder, type = "text", textarea = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; textarea?: boolean;
}) {
  const base = "w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#ACF417]/50 focus:border-[#ACF417]/60 transition-all placeholder-slate-300";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className={`${base} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={base}
        />
      )}
    </div>
  );
}

export default function ProfilePageClient({
  userId, profile, skills: initSkills, workExperiences: initWork,
  education: initEdu, projects: initProjects, certifications: initCerts,
}: ProfilePageClientProps) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile state
  const [pf, setPf] = useState({
    full_name: profile?.full_name ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    location: profile?.location ?? "",
    headline: profile?.headline ?? "",
    linkedin_url: profile?.linkedin_url ?? "",
    github_url: profile?.github_url ?? "",
    website: profile?.website ?? "",
    summary: profile?.summary ?? "",
  });

  // Skills state
  const [skills, setSkills] = useState<Skill[]>(initSkills);
  const [newSkill, setNewSkill] = useState("");

  // Work Experiences
  const [workExps, setWorkExps] = useState<WorkExperience[]>(initWork);
  const [expandedWork, setExpandedWork] = useState<string | null>(initWork[0]?.id ?? null);

  // Education
  const [education, setEducation] = useState<Education[]>(initEdu);

  // Projects
  const [projects, setProjects] = useState<Project[]>(initProjects);

  // Certifications
  const [certifications, setCertifications] = useState<Certification[]>(initCerts);

  // Controlled section open states (to allow checklist navigation to auto-open sections)
  const [educationOpen, setEducationOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [certificationsOpen, setCertificationsOpen] = useState(false);

  const handleNavigateToSection = (sectionId: string) => {
    if (sectionId === "education-section") {
      setEducationOpen(true);
    } else if (sectionId === "projects-section") {
      setProjectsOpen(true);
    } else if (sectionId === "certifications-section") {
      setCertificationsOpen(true);
    }

    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("ring-2", "ring-[#ACF417]");
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-[#ACF417]");
        }, 2000);
      }
    }, 100);
  };

  const pfChange = (key: keyof typeof pf) => (val: string) => setPf((p) => ({ ...p, [key]: val }));

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Profile
      await supabase.from("profiles").update({ ...pf, updated_at: new Date().toISOString() }).eq("id", userId);

      // Skills — delete then re-insert
      await supabase.from("skills").delete().eq("user_id", userId);
      if (skills.length) {
        await supabase.from("skills").insert(skills.map((s) => ({ user_id: userId, name: s.name, category: s.category })));
      }

      // Work experiences — delete then re-insert
      await supabase.from("work_experiences").delete().eq("user_id", userId);
      if (workExps.length) {
        await supabase.from("work_experiences").insert(
          workExps.map((w, i) => ({ user_id: userId, company_name: w.company_name, job_title: w.job_title, start_date: w.start_date, end_date: w.end_date, is_current: w.is_current, location: w.location, responsibilities: w.responsibilities, sort_order: i }))
        );
      }

      // Education — delete then re-insert
      await supabase.from("education").delete().eq("user_id", userId);
      if (education.length) {
        await supabase.from("education").insert(
          education.map((e, i) => ({ user_id: userId, institution: e.institution, degree: e.degree, field_of_study: e.field_of_study, start_date: e.start_date, end_date: e.end_date, gpa: e.gpa, description: e.description, sort_order: i }))
        );
      }

      // Projects — delete then re-insert
      await supabase.from("projects").delete().eq("user_id", userId);
      if (projects.length) {
        await supabase.from("projects").insert(
          projects.map((p, i) => ({ user_id: userId, name: p.name, description: p.description, technologies: p.technologies, project_url: p.project_url, github_url: p.github_url, start_date: p.start_date, end_date: p.end_date, sort_order: i }))
        );
      }

      // Certifications — delete then re-insert
      await supabase.from("certifications").delete().eq("user_id", userId);
      if (certifications.length) {
        await supabase.from("certifications").insert(
          certifications.map((c, i) => ({ user_id: userId, name: c.name, issuer: c.issuer, issue_date: c.issue_date, expiry_date: c.expiry_date, credential_url: c.credential_url, sort_order: i }))
        );
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setSkills((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: newSkill.trim(), category: "General" },
    ]);
    setNewSkill("");
  };

  const removeSkill = (id: string) => setSkills((prev) => prev.filter((s) => s.id !== id));

  const updateWork = (id: string, key: keyof WorkExperience, val: any) =>
    setWorkExps((prev) => prev.map((w) => (w.id === id ? { ...w, [key]: val } : w)));

  const updateEdu = (id: string, key: keyof Education, val: any) =>
    setEducation((prev) => prev.map((e) => (e.id === id ? { ...e, [key]: val } : e)));

  const updateProject = (id: string, key: keyof Project, val: any) =>
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, [key]: val } : p)));

  const updateCert = (id: string, key: keyof Certification, val: any) =>
    setCertifications((prev) => prev.map((c) => (c.id === id ? { ...c, [key]: val } : c)));

  // Group skills by category
  const skillsByCategory = skills.reduce<Record<string, Skill[]>>((acc, s) => {
    const cat = s.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto pb-10 px-4 md:px-0">
      {/* Page header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Profile</h2>
          <p className="text-sm text-slate-500 mt-1">Review and edit the information extracted from your resume.</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ACF417] text-slate-900 text-sm font-bold rounded-xl hover:bg-[#9de012] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Saving…
            </>
          ) : saved ? (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save changes
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left side: Main Profile Form */}
        <div className="md:col-span-2 space-y-5">
          {/* Personal Information */}
          <Section id="personal-info" title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-5">
              <InputField label="Full name" value={pf.full_name} onChange={pfChange("full_name")} placeholder="John Doe" />
              <InputField label="Email" value={pf.email} onChange={pfChange("email")} placeholder="john@example.com" type="email" />
              <InputField label="Phone" value={pf.phone} onChange={pfChange("phone")} placeholder="+1 (555) 123-4567" />
              <InputField label="Location" value={pf.location} onChange={pfChange("location")} placeholder="San Francisco, CA" />
              <div className="sm:col-span-2">
                <InputField label="Headline" value={pf.headline} onChange={pfChange("headline")} placeholder="Software Engineer at Apple Inc." />
              </div>
              <InputField label="LinkedIn URL" value={pf.linkedin_url} onChange={pfChange("linkedin_url")} placeholder="linkedin.com/in/username" />
              <InputField label="GitHub URL" value={pf.github_url} onChange={pfChange("github_url")} placeholder="github.com/username" />
              <div className="sm:col-span-2">
                <InputField label="Website" value={pf.website} onChange={pfChange("website")} placeholder="yourwebsite.com" />
              </div>
            </div>
          </Section>

          {/* Professional Summary */}
          <Section id="professional-summary" title="Professional Summary">
            <div className="pt-5">
              <InputField
                label="Summary"
                value={pf.summary}
                onChange={pfChange("summary")}
                placeholder="A brief overview of your professional background and goals…"
                textarea
              />
            </div>
          </Section>

          {/* Skills */}
          <Section id="skills-section" title="Skills">
            <div className="pt-5 space-y-4">
              {Object.entries(skillsByCategory).map(([category, catSkills]) => (
                <div key={category}>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{category}</p>
                  <div className="flex flex-wrap gap-2">
                    {catSkills.map((skill) => (
                      <span
                        key={skill.id}
                        className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors"
                      >
                        {skill.name}
                        <button
                          onClick={() => removeSkill(skill.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {/* Add skill */}
              <div className="flex gap-2 pt-1">
                <input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  placeholder="Add a skill…"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ACF417]/50 focus:border-[#ACF417]/60 transition-all bg-white text-slate-800"
                />
                <button
                  onClick={addSkill}
                  className="px-4 py-2.5 bg-[#ACF417] text-slate-900 text-sm font-bold rounded-xl hover:bg-[#9de012] transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </Section>

          {/* Work Experience */}
          <Section id="work-experience-section" title="Work Experience">
            <div className="pt-5 space-y-3">
              {workExps.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No work experience added yet.</p>
              )}
              {workExps.map((w) => (
                <div key={w.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setExpandedWork(expandedWork === w.id ? null : w.id)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{w.job_title || "Untitled Role"}</p>
                      <p className="text-xs text-slate-500">{w.company_name} · {w.start_date} – {w.is_current ? "Present" : w.end_date}</p>
                    </div>
                    <svg className={`h-4 w-4 text-slate-400 transition-transform ${expandedWork === w.id ? "" : "-rotate-90"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>

                  {expandedWork === w.id && (
                    <div className="px-4 pb-4 border-t border-slate-100 space-y-3 pt-4 bg-white">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InputField label="Job Title" value={w.job_title} onChange={(v) => updateWork(w.id, "job_title", v)} />
                        <InputField label="Company Name" value={w.company_name} onChange={(v) => updateWork(w.id, "company_name", v)} />
                        <InputField label="Start Date" value={w.start_date} onChange={(v) => updateWork(w.id, "start_date", v)} placeholder="Jan 2022" />
                        <InputField label="End Date" value={w.end_date} onChange={(v) => updateWork(w.id, "end_date", v)} placeholder="Dec 2023 / Present" />
                        <div className="sm:col-span-2">
                          <InputField label="Location" value={w.location} onChange={(v) => updateWork(w.id, "location", v)} placeholder="Remote / City, Country" />
                        </div>
                      </div>
                      {/* Responsibilities */}
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Responsibilities</label>
                        <div className="space-y-2">
                          {(w.responsibilities || []).map((resp, ri) => (
                            <div key={ri} className="flex gap-2 items-start">
                              <span className="mt-3 text-[#ACF417] font-bold text-lg leading-none">·</span>
                              <input
                                value={resp}
                                onChange={(e) => {
                                  const newResps = [...w.responsibilities];
                                  newResps[ri] = e.target.value;
                                  updateWork(w.id, "responsibilities", newResps);
                                }}
                                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ACF417]/50 bg-white text-slate-800"
                              />
                              <button
                                onClick={() => updateWork(w.id, "responsibilities", w.responsibilities.filter((_, i) => i !== ri))}
                                className="mt-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => updateWork(w.id, "responsibilities", [...(w.responsibilities || []), ""])}
                          className="mt-2 text-xs font-semibold text-[#7ab30e] hover:text-[#5a8c00] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Add bullet point
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={() => {
                  const newExp: WorkExperience = { id: crypto.randomUUID(), company_name: "", job_title: "", start_date: "", end_date: "", is_current: false, location: "", responsibilities: [] };
                  setWorkExps((prev) => [...prev, newExp]);
                  setExpandedWork(newExp.id);
                }}
                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-400 hover:border-[#ACF417]/50 hover:text-slate-600 transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Work Experience
              </button>
            </div>
          </Section>

          {/* Education */}
          <Section
            id="education-section"
            title="Education"
            open={educationOpen}
            onOpenChange={setEducationOpen}
          >
            <div className="pt-5 space-y-4">
              {education.map((e) => (
                <div key={e.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-slate-800">{e.institution || "Institution"}</p>
                    <button
                      onClick={() => setEducation((prev) => prev.filter((ed) => ed.id !== e.id))}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InputField label="Institution" value={e.institution} onChange={(v) => updateEdu(e.id, "institution", v)} />
                    <InputField label="Degree" value={e.degree} onChange={(v) => updateEdu(e.id, "degree", v)} placeholder="Bachelor of Science" />
                    <InputField label="Field of Study" value={e.field_of_study} onChange={(v) => updateEdu(e.id, "field_of_study", v)} placeholder="Computer Science" />
                    <InputField label="GPA" value={e.gpa} onChange={(v) => updateEdu(e.id, "gpa", v)} placeholder="3.8" />
                    <InputField label="Start Date" value={e.start_date} onChange={(v) => updateEdu(e.id, "start_date", v)} />
                    <InputField label="End Date" value={e.end_date} onChange={(v) => updateEdu(e.id, "end_date", v)} />
                  </div>
                </div>
              ))}
              <button
                onClick={() => setEducation((prev) => [...prev, { id: crypto.randomUUID(), institution: "", degree: "", field_of_study: "", start_date: "", end_date: "", gpa: "", description: "" }])}
                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-400 hover:border-[#ACF417]/50 hover:text-slate-600 transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Education
              </button>
            </div>
          </Section>

          {/* Projects */}
          <Section
            id="projects-section"
            title="Projects"
            open={projectsOpen}
            onOpenChange={setProjectsOpen}
          >
            <div className="pt-5 space-y-4">
              {projects.map((p) => (
                <div key={p.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-slate-800">{p.name || "Project"}</p>
                    <button onClick={() => setProjects((prev) => prev.filter((pr) => pr.id !== p.id))} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InputField label="Project Name" value={p.name} onChange={(v) => updateProject(p.id, "name", v)} />
                    <InputField label="Project URL" value={p.project_url} onChange={(v) => updateProject(p.id, "project_url", v)} />
                    <InputField label="GitHub URL" value={p.github_url} onChange={(v) => updateProject(p.id, "github_url", v)} />
                    <InputField label="Start Date" value={p.start_date} onChange={(v) => updateProject(p.id, "start_date", v)} />
                    <div className="sm:col-span-2">
                      <InputField label="Description" value={p.description} onChange={(v) => updateProject(p.id, "description", v)} textarea />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Technologies</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(p.technologies || []).map((tech, ti) => (
                          <span key={ti} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg">
                            {tech}
                            <button onClick={() => updateProject(p.id, "technologies", p.technologies.filter((_, i) => i !== ti))} className="text-slate-400 hover:text-red-500 cursor-pointer">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                      <input
                        placeholder="Add technology, press Enter…"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ACF417]/50 bg-white text-slate-800"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.currentTarget.value.trim()) {
                            updateProject(p.id, "technologies", [...(p.technologies || []), e.currentTarget.value.trim()]);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setProjects((prev) => [...prev, { id: crypto.randomUUID(), name: "", description: "", technologies: [], project_url: "", github_url: "", start_date: "", end_date: "" }])}
                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-400 hover:border-[#ACF417]/50 hover:text-slate-600 transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Project
              </button>
            </div>
          </Section>

          {/* Certifications */}
          <Section
            id="certifications-section"
            title="Certifications & Awards"
            open={certificationsOpen}
            onOpenChange={setCertificationsOpen}
          >
            <div className="pt-5 space-y-4">
              {certifications.map((c) => (
                <div key={c.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-slate-800">{c.name || "Certification"}</p>
                    <button onClick={() => setCertifications((prev) => prev.filter((cert) => cert.id !== c.id))} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InputField label="Name" value={c.name} onChange={(v) => updateCert(c.id, "name", v)} />
                    <InputField label="Issuer" value={c.issuer} onChange={(v) => updateCert(c.id, "issuer", v)} />
                    <InputField label="Issue Date" value={c.issue_date} onChange={(v) => updateCert(c.id, "issue_date", v)} />
                    <InputField label="Expiry Date" value={c.expiry_date} onChange={(v) => updateCert(c.id, "expiry_date", v)} />
                    <div className="sm:col-span-2">
                      <InputField label="Credential URL" value={c.credential_url} onChange={(v) => updateCert(c.id, "credential_url", v)} />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setCertifications((prev) => [...prev, { id: crypto.randomUUID(), name: "", issuer: "", issue_date: "", expiry_date: "", credential_url: "" }])}
                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-400 hover:border-[#ACF417]/50 hover:text-slate-600 transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Certification
              </button>
            </div>
          </Section>
        </div>

        {/* Right side: Sticky Completeness Card */}
        <div className="space-y-5 md:sticky md:top-6 order-first md:order-last">
          <ProfileCompletenessCard
            profile={pf}
            skills={skills}
            workExperiences={workExps}
            education={education}
            projects={projects}
            certifications={certifications}
            onNavigateToSection={handleNavigateToSection}
          />
        </div>
      </div>

      {/* Floating save indicator */}
      {saved && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-2xl shadow-xl animate-in slide-in-from-bottom-4 duration-300">
          <svg className="h-4 w-4 text-[#ACF417]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          All changes saved!
        </div>
      )}
    </div>
  );
}
