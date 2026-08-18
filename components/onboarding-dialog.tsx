"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface OnboardingDialogProps {
  userId: string;
  userEmail: string;
  onComplete: () => void;
}

type UploadState = "idle" | "uploading" | "parsing" | "done" | "error";

export default function OnboardingDialog({
  userId,
  userEmail,
  onComplete,
}: OnboardingDialogProps) {
  const router = useRouter();
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      setSelectedFile(file);
      setErrorMsg("");
      setUploadState("uploading");
      setProgress(10);

      try {
        const supabase = createClient();

        // Build unique file path
        const ext = file.name.split(".").pop();
        const timestamp = Date.now();
        const filePath = `${userId}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(filePath, file, { upsert: false });

        if (uploadError) throw new Error(uploadError.message);
        setProgress(40);

        // Insert resume record
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

        // Call parse API
        const parseRes = await fetch("/api/resume/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeId: resumeRecord.id,
            filePath,
            userId,
          }),
        });

        if (!parseRes.ok) {
          const errData = await parseRes.json();
          throw new Error(errData.error || "Failed to parse resume");
        }

        setProgress(100);
        setUploadState("done");

        // Allow user to see success state, then close dialog and refresh
        setTimeout(() => {
          onComplete();
          router.refresh();
          router.push("/dashboard/profile");
        }, 1800);
      } catch (err: any) {
        setErrorMsg(err.message || "Something went wrong. Please try again.");
        setUploadState("error");
        setProgress(0);
      }
    },
    [userId, onComplete, router]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const stateConfig = {
    idle: { label: "Upload your resume to get started" },
    uploading: { label: "Uploading your resume…" },
    parsing: { label: "Analysing your resume with AI…" },
    done: { label: "Resume parsed successfully! Redirecting…" },
    error: { label: "Something went wrong" },
  };

  return (
    /* Fixed full-screen backdrop — no pointer events to outside */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      aria-modal="true"
      role="dialog"
      aria-label="Upload your resume to continue"
    >
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#ACF417] via-[#8cc610] to-[#ACF417]" />

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ACF417]/15 border border-[#ACF417]/30 mb-4">
              <svg className="h-7 w-7 text-[#7ab30e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome to JobBuddy AI 👋
            </h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
              Upload your resume to get started. We'll extract your information and auto-fill your profile.
            </p>
          </div>

          {/* Upload Zone */}
          {uploadState === "idle" || uploadState === "error" ? (
            <label
              htmlFor="resume-upload-input"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`flex flex-col items-center justify-center gap-4 w-full rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-[#ACF417] bg-[#ACF417]/8 scale-[1.01]"
                  : "border-slate-200 bg-slate-50 hover:border-[#ACF417]/50 hover:bg-[#ACF417]/5"
              }`}
            >
              <input
                id="resume-upload-input"
                type="file"
                accept=".pdf,.docx"
                className="sr-only"
                onChange={handleFileInput}
              />
              {/* Upload icon */}
              <div
                className={`h-14 w-14 rounded-full flex items-center justify-center transition-colors ${
                  isDragging ? "bg-[#ACF417]/20" : "bg-white border border-slate-200"
                }`}
              >
                <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
              </div>

              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">
                  {isDragging ? "Drop it here!" : "Drop your resume here"}
                </p>
                <p className="text-xs text-slate-400 mt-1">PDF or DOCX · up to 5 MB</p>
              </div>

              <div className="flex items-center gap-3 w-full">
                <div className="flex-1 border-t border-slate-200" />
                <span className="text-xs text-slate-400">or</span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors shadow-sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                Choose file
              </span>
            </label>
          ) : null}

          {/* Progress States */}
          {(uploadState === "uploading" || uploadState === "parsing") && (
            <div className="flex flex-col items-center gap-5 py-4">
              {/* Animated spinner */}
              <div className="relative h-20 w-20">
                <svg className="h-20 w-20 -rotate-90 animate-spin" style={{ animationDuration: "1.5s" }} viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke="#ACF417" strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                    style={{ transition: "stroke-dashoffset 0.5s ease" }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">
                  {progress}%
                </span>
              </div>

              <div className="text-center">
                <p className="text-sm font-semibold text-slate-800">
                  {uploadState === "uploading" ? "Uploading…" : "Parsing with AI…"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {uploadState === "uploading"
                    ? "Securely uploading your resume"
                    : "Gemini is extracting your profile data"}
                </p>
              </div>

              {/* Step indicators */}
              <div className="flex items-center gap-2 text-xs">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium ${
                  uploadState === "uploading"
                    ? "bg-[#ACF417]/20 text-slate-700"
                    : "bg-[#ACF417] text-slate-900"
                }`}>
                  {uploadState !== "uploading" && (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Upload
                </div>
                <div className="w-5 border-t border-slate-200" />
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium ${
                  uploadState === "parsing"
                    ? "bg-[#ACF417]/20 text-slate-700"
                    : "bg-slate-100 text-slate-400"
                }`}>
                  AI Parse
                </div>
                <div className="w-5 border-t border-slate-200" />
                <div className="px-3 py-1.5 rounded-full font-medium bg-slate-100 text-slate-400">
                  Done
                </div>
              </div>
            </div>
          )}

          {/* Done state */}
          {uploadState === "done" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="h-20 w-20 rounded-full bg-[#ACF417]/20 border-2 border-[#ACF417] flex items-center justify-center animate-in zoom-in duration-300">
                <svg className="h-10 w-10 text-[#7ab30e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-slate-900">Resume parsed!</p>
                <p className="text-sm text-slate-500 mt-1">Your profile has been auto-filled. Redirecting…</p>
              </div>
            </div>
          )}

          {/* Error message */}
          {uploadState === "error" && errorMsg && (
            <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
              <svg className="h-5 w-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-700">Upload failed</p>
                <p className="text-xs text-red-500 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Footer notice */}
          {(uploadState === "idle" || uploadState === "error") && (
            <p className="text-center text-xs text-slate-400 mt-5">
              🔒 Your resume is stored securely and never shared
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
