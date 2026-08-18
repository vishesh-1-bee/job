import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResumePageClient from "./resume-client";

export default async function ResumePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: resumes } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <ResumePageClient userId={user.id} initialResumes={resumes ?? []} />;
}
