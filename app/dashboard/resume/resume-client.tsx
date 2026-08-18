"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Resume {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  status: "pending" | "parsing" | "parsed" | "error";
  is_primary: boolean;
  created_at: string;
}

interface ResumePageClientProps {
  userId: string;
  initialResumes: Resume[];
}

type UploadState = "idle" | "uploading" | "parsing" | "done" | "error";

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const StatusBadge = ({ status }: { status: Resume["status"] }) => {
  const config = {
    parsed: { label: "Parsed", bg: "bg-[#ACF417]/20 text-[#5a8c00] border border-[#ACF417]/30" },
    parsing: { label: "Parsing…", bg: "bg-blue-50 text-blue-700 border border-blue-200" },
    pending: { label: "Pending", bg: "bg-amber-50 text-amber-700 border border-amber-200" },
    error: { label: "Error", bg: "bg-red-50 text-red-700 border border-red-200" },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${c.bg}`}>
      {c.label}
    </span>
  );
};

export default function ResumePageClient({ userId, initialResumes }: ResumePageClientProps) {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>(initialResumes);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Please upload a PDF or DOCX file.");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("File size must be under 5 MB.");
      return false;
    }
    return true;
  };

  const processFile = useCallback(
    async (file: File) => {
      if (!validateFile(file)) return;
      setErrorMsg("");
      setUploadState("uploading");
      setProgress(15);

      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop();
        const timestamp = Date.now();
        const filePath = `${userId}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

        const { error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(filePath, file);

        if (uploadError) throw new Error(uploadError.message);
        setProgress(40);

        const { data: resumeRecord, error: dbError } = await supabase
          .from("resumes")
          .insert({
            user_id: userId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
            status: "pending",
          })
          .select()
          .single();

        if (dbError) throw new Error(dbError.message);
        setProgress(55);
        setUploadState("parsing");

        // Optimistically add to list
        setResumes((prev) => [{ ...resumeRecord, status: "parsing" } as Resume, ...prev]);

        const parseRes = await fetch("/api/resume/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeId: resumeRecord.id, filePath, userId }),
        });

        if (!parseRes.ok) {
          const errData = await parseRes.json();
          throw new Error(errData.error || "Parse failed");
        }

        setProgress(100);
        setUploadState("done");

        // Refresh list
        setTimeout(() => {
          router.refresh();
          setUploadState("idle");
          setProgress(0);
        }, 1500);
      } catch (err: any) {
        setErrorMsg(err.message || "Upload failed. Please try again.");
        setUploadState("error");
        setProgress(0);
      }
    },
    [userId, router]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDownload = async (resume: Resume) => {
    const supabase = createClient();
    const { data } = await supabase.storage.from("resumes").createSignedUrl(resume.file_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async (resumeId: string, filePath: string) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;
    const supabase = createClient();
    await supabase.storage.from("resumes").remove([filePath]);
    await supabase.from("resumes").delete().eq("id", resumeId);
    setResumes((prev) => prev.filter((r) => r.id !== resumeId));
  };

  const isProcessing = uploadState === "uploading" || uploadState === "parsing";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Resume</h2>
        <p className="text-sm text-slate-500 mt-1">Manage your uploaded resumes.</p>
      </div>

      {/* Upload Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-1">Upload another resume</h3>
        <p className="text-sm text-slate-500 mb-5">Upload a new version to update your profile data.</p>

        {/* Drop zone */}
        {!isProcessing && uploadState !== "done" && (
          <label
            htmlFor="resume-page-upload"
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            className={`flex flex-col items-center justify-center gap-3 w-full rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-all duration-200 ${
              isDragging
                ? "border-[#ACF417] bg-[#ACF417]/5"
                : "border-slate-200 bg-slate-50 hover:border-[#ACF417]/50 hover:bg-[#ACF417]/5"
            }`}
          >
            <input id="resume-page-upload" type="file" accept=".pdf,.docx" className="sr-only" onChange={handleFileInput} />
            <div className={`h-14 w-14 rounded-full flex items-center justify-center transition-colors ${isDragging ? "bg-[#ACF417]/20" : "bg-white border border-slate-200"}`}>
              <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">Drop your resume here</p>
              <p className="text-xs text-slate-400 mt-1">PDF or DOCX, up to 5 MB</p>
            </div>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Choose file
            </span>
          </label>
        )}

        {/* Progress */}
        {isProcessing && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="relative h-16 w-16">
              <svg className="h-16 w-16 -rotate-90" style={{ animation: "spin 1.5s linear infinite" }} viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="27" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                <circle
                  cx="32" cy="32" r="27" fill="none"
                  stroke="#ACF417" strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 27}`}
                  strokeDashoffset={`${2 * Math.PI * 27 * (1 - progress / 100)}`}
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">{progress}%</span>
            </div>
            <p className="text-sm font-medium text-slate-700">
              {uploadState === "uploading" ? "Uploading your resume…" : "AI is parsing your resume…"}
            </p>
          </div>
        )}

        {/* Done */}
        {uploadState === "done" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="h-14 w-14 rounded-full bg-[#ACF417]/20 border-2 border-[#ACF417] flex items-center justify-center">
              <svg className="h-7 w-7 text-[#7ab30e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-800">Resume uploaded and parsed!</p>
          </div>
        )}

        {/* Error */}
        {uploadState === "error" && errorMsg && (
          <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
            <svg className="h-5 w-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-700">Upload failed</p>
              <p className="text-xs text-red-500 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}
      </div>

      {/* Resumes List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">Your resumes</h3>
        </div>

        {resumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <svg className="h-10 w-10 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No resumes uploaded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="text-left px-6 py-3">File</th>
                  <th className="text-left px-4 py-3">Uploaded</th>
                  <th className="text-left px-4 py-3">Size</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resumes.map((resume, idx) => (
                  <tr
                    key={resume.id}
                    className={`transition-colors hover:bg-slate-50 ${idx !== resumes.length - 1 ? "border-b border-slate-100" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 max-w-[200px] truncate">{resume.file_name}</p>
                          {resume.is_primary && (
                            <span className="text-[10px] font-semibold text-[#7ab30e] bg-[#ACF417]/10 px-1.5 py-0.5 rounded">Primary</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {formatDate(resume.created_at)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {formatBytes(resume.file_size)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={resume.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Download */}
                        <button
                          onClick={() => handleDownload(resume)}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Download"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(resume.id, resume.file_path)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
