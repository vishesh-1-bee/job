import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfilePageClient from "./profile-client";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Fetch all profile-related data in parallel
  const [
    { data: profile },
    { data: skills },
    { data: workExperiences },
    { data: education },
    { data: projects },
    { data: certifications },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("skills").select("*").eq("user_id", user.id).order("category"),
    supabase.from("work_experiences").select("*").eq("user_id", user.id).order("sort_order"),
    supabase.from("education").select("*").eq("user_id", user.id).order("sort_order"),
    supabase.from("projects").select("*").eq("user_id", user.id).order("sort_order"),
    supabase.from("certifications").select("*").eq("user_id", user.id).order("sort_order"),
  ]);

  return (
    <ProfilePageClient
      userId={user.id}
      profile={profile}
      skills={skills ?? []}
      workExperiences={workExperiences ?? []}
      education={education ?? []}
      projects={projects ?? []}
      certifications={certifications ?? []}
    />
  );
}
