import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const RESUME_EXTRACTION_PROMPT = `You are an expert resume parser. Extract ALL information from this resume and return it as a valid JSON object.

Return ONLY valid JSON with this exact structure (use null for missing fields, empty arrays [] for missing lists):
{
  "personal": {
    "full_name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "headline": "string",
    "linkedin_url": "string",
    "github_url": "string",
    "website": "string"
  },
  "summary": "string",
  "skills": [
    { "name": "string", "category": "string" }
  ],
  "work_experiences": [
    {
      "company_name": "string",
      "job_title": "string",
      "start_date": "string",
      "end_date": "string",
      "is_current": false,
      "location": "string",
      "responsibilities": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field_of_study": "string",
      "start_date": "string",
      "end_date": "string",
      "gpa": "string",
      "description": "string"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "project_url": "string",
      "github_url": "string",
      "start_date": "string",
      "end_date": "string"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "issue_date": "string",
      "expiry_date": "string",
      "credential_url": "string"
    }
  ]
}

For skills, infer sensible categories such as "Programming Languages", "Frameworks", "Tools", "Databases", "Cloud", "Soft Skills", etc.
For work_experiences, list responsibilities as concise bullet point strings.
Work experiences and education should be ordered from most recent to oldest.`;

export async function POST(req: NextRequest) {
  try {
    const { resumeId, filePath, userId } = await req.json();

    if (!resumeId || !filePath || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: resumeId, filePath, userId" },
        { status: 400 }
      );
    }

    // Update status to parsing
    await supabaseAdmin
      .from("resumes")
      .update({ status: "parsing" })
      .eq("id", resumeId);

    // Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from("resumes")
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    // Extract text based on file type
    const isDocx = filePath.toLowerCase().endsWith(".docx");
    let resumeText = "";

    if (isDocx) {
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer });
      resumeText = result.value;
    } else {
      // PDF
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const parser = new PDFParse({ data: buffer });

      try {
      const pdfData = await parser.getText();
      resumeText = pdfData.text;
    } finally {
      await parser.destroy();
    }

    }

    if (!resumeText || resumeText.trim().length < 50) {
      throw new Error("Could not extract meaningful text from the resume file.");
    }

    // Call Gemini to parse
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
    const result = await model.generateContent([
      RESUME_EXTRACTION_PROMPT,
      `\n\nRESUME CONTENT:\n${resumeText}`,
    ]);

    const responseText = result.response.text();

    // Strip markdown code fences if present
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) || [
      null,
      responseText,
    ];
    const cleanJson = (jsonMatch[1] || responseText).trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      throw new Error("Gemini returned invalid JSON. Please try again.");
    }

    // Save to database — all operations in parallel
    const { personal, summary, skills, work_experiences, education, projects, certifications } = parsed;

    // 1. Update profile
    const profileUpdate: Record<string, any> = {
      has_resume: true,
      updated_at: new Date().toISOString(),
    };
    if (personal?.full_name) profileUpdate.full_name = personal.full_name;
    if (personal?.email) profileUpdate.email = personal.email;
    if (personal?.phone) profileUpdate.phone = personal.phone;
    if (personal?.location) profileUpdate.location = personal.location;
    if (personal?.headline) profileUpdate.headline = personal.headline;
    if (personal?.linkedin_url) profileUpdate.linkedin_url = personal.linkedin_url;
    if (personal?.github_url) profileUpdate.github_url = personal.github_url;
    if (personal?.website) profileUpdate.website = personal.website;
    if (summary) profileUpdate.summary = summary;

    await supabaseAdmin.from("profiles").update(profileUpdate).eq("id", userId);

    // 2. Clear old data and insert new (clean slate approach for re-upload)
    await Promise.all([
      supabaseAdmin.from("skills").delete().eq("user_id", userId),
      supabaseAdmin.from("work_experiences").delete().eq("user_id", userId),
      supabaseAdmin.from("education").delete().eq("user_id", userId),
      supabaseAdmin.from("projects").delete().eq("user_id", userId),
      supabaseAdmin.from("certifications").delete().eq("user_id", userId),
    ]);

    // 3. Insert all parsed data sequentially
    if (skills?.length) {
      await supabaseAdmin.from("skills").insert(
        skills.map((s: any) => ({ user_id: userId, name: s.name || "", category: s.category || "General" }))
      );
    }

    if (work_experiences?.length) {
      await supabaseAdmin.from("work_experiences").insert(
        work_experiences.map((w: any, i: number) => ({
          user_id: userId, company_name: w.company_name || "", job_title: w.job_title || "",
          start_date: w.start_date || "", end_date: w.end_date || "",
          is_current: w.is_current || false, location: w.location || "",
          responsibilities: w.responsibilities || [], sort_order: i,
        }))
      );
    }

    if (education?.length) {
      await supabaseAdmin.from("education").insert(
        education.map((e: any, i: number) => ({
          user_id: userId, institution: e.institution || "", degree: e.degree || "",
          field_of_study: e.field_of_study || "", start_date: e.start_date || "",
          end_date: e.end_date || "", gpa: e.gpa || "", description: e.description || "", sort_order: i,
        }))
      );
    }

    if (projects?.length) {
      await supabaseAdmin.from("projects").insert(
        projects.map((p: any, i: number) => ({
          user_id: userId, name: p.name || "", description: p.description || "",
          technologies: p.technologies || [], project_url: p.project_url || "",
          github_url: p.github_url || "", start_date: p.start_date || "",
          end_date: p.end_date || "", sort_order: i,
        }))
      );
    }

    if (certifications?.length) {
      await supabaseAdmin.from("certifications").insert(
        certifications.map((c: any, i: number) => ({
          user_id: userId, name: c.name || "", issuer: c.issuer || "",
          issue_date: c.issue_date || "", expiry_date: c.expiry_date || "",
          credential_url: c.credential_url || "", sort_order: i,
        }))
      );
    }

    // Update resume status to parsed + mark as primary
    await supabaseAdmin
      .from("resumes")
      .update({ status: "parsed", is_primary: true })
      .eq("id", resumeId);

    // Unmark other resumes as primary
    await supabaseAdmin
      .from("resumes")
      .update({ is_primary: false })
      .eq("user_id", userId)
      .neq("id", resumeId);

    return NextResponse.json({ success: true, parsed });
  } catch (error: any) {
    console.error("Resume parse error:", error);
    return NextResponse.json(
      { error: error.message || "Resume parsing failed" },
      { status: 500 }
    );
  }
}
