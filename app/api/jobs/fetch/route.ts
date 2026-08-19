import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const BRAVE_API_KEY = process.env.BRAVE_API_KEY || "BSAEvzmeNv72rBGYvL9axHUI_qgIo08";
const CACHE_HOURS = 6;

const PLATFORM_SITES: Record<string, string> = {
  greenhouse: "site:boards.greenhouse.io",
  lever: "site:jobs.lever.co",
  workable: "site:apply.workable.com",
  wellfound: "site:wellfound.com/jobs",
  linkedin: "site:linkedin.com/jobs",
};

// ── helpers ──────────────────────────────────────────────────────────────────

/** Extract job location from search result snippet text */
function extractJobLocation(snippet: string, title: string): string {
  const text = `${title} ${snippet}`;
  // Common patterns: "Remote", "New York, NY", "London, UK", "Bangalore, India"
  const remoteMatch = /\b(remote|worldwide|anywhere|globally|work from home|wfh)\b/i.exec(text);
  if (remoteMatch) return "Remote";

  // City, State/Country patterns
  const locationMatch = text.match(
    /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)(?:\s*,\s*([A-Z]{2}|[A-Z][a-z]+(?:\s[A-Z][a-z]+)?))\b/
  );
  if (locationMatch) return locationMatch[0].trim();

  // Hybrid pattern
  if (/\bhybrid\b/i.test(text)) return "Hybrid";

  return "Global / Remote";
}

const HIGH_PRIORITY_TECH = new Set([
  "react", "next", "node", "typescript", "javascript", "python", "django", "fastapi",
  "java", "spring", "golang", "go", "rust", "angular", "vue", "docker", "kubernetes",
  "aws", "gcp", "azure", "postgresql", "mysql", "mongodb"
]);

function selectSearchSkills(skills: string[]): string[] {
  // 1. Normalize/Clean skill names
  const cleaned = skills.map(s => {
    let name = s.trim();
    name = name.replace(/\.js$/i, "");
    name = name.replace(/\s*\(.*\)$/g, ""); // remove parenthesis contents like (ES6+)
    name = name.replace(/5$/g, ""); // HTML5 -> HTML
    name = name.replace(/3$/g, ""); // CSS3 -> CSS
    return name;
  });

  // 2. Define generic/tool terms to exclude or deprioritize
  const ignored = new Set([
    "git", "github", "vscode", "postman", "npm", "restful apis", "restful api", 
    "authentication", "api integration", "tools", "soft skills", "troubleshooting",
    "user training", "project delivery", "system solutions", "html", "css", "mongoose"
  ]);

  // 3. Filter out ignored skills and keep unique ones
  const filtered = cleaned.filter(s => !ignored.has(s.toLowerCase()));

  // 4. Sort to prioritize core technology keywords first
  filtered.sort((a, b) => {
    const aPri = HIGH_PRIORITY_TECH.has(a.toLowerCase()) ? 1 : 0;
    const bPri = HIGH_PRIORITY_TECH.has(b.toLowerCase()) ? 1 : 0;
    return bPri - aPri;
  });

  return filtered.length > 0 ? Array.from(new Set(filtered)) : Array.from(new Set(cleaned));
}

function buildQuery(
  platform: string,
  role: string,
  skills: string[],
  jobType: string
): string {
  const site = PLATFORM_SITES[platform] || `site:${platform}`;
  
  // Select the most searchable/impactful skills from the user's resume
  const searchSkills = selectSearchSkills(skills);
  const topSkills = searchSkills.slice(0, 3).join(" OR "); // Use top 3 skills with OR for broader results
  
  const parts = [site, `"${role || "Software Developer"}"`, topSkills]
    .filter(Boolean)
    .join(" ");
  return parts;
}

function extractSalary(snippet: string): string {
  const match = snippet.match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?(?:\s*(?:\/yr|\/year|\/mo|k))?/i);
  return match ? match[0] : "";
}

function extractJobType(snippet: string, title: string): string {
  const text = `${title} ${snippet}`.toLowerCase();
  if (text.includes("contract")) return "Contract";
  if (text.includes("part-time") || text.includes("part time")) return "Part-time";
  if (text.includes("intern")) return "Internship";
  return "Full-time";
}

function extractExperienceLevel(snippet: string, title: string): string {
  const text = `${title} ${snippet}`.toLowerCase();
  if (text.includes("senior") || text.includes("sr.") || text.includes("lead")) return "Senior";
  if (text.includes("junior") || text.includes("jr.") || text.includes("entry")) return "Entry";
  if (text.includes("principal") || text.includes("staff") || text.includes("director")) return "Principal";
  if (text.includes("intern")) return "Internship";
  return "Mid";
}

function computeMatchScore(skills: string[], title: string, snippet: string, tags: string[]): number {
  if (!skills.length) return Math.floor(Math.random() * 30) + 50;
  const text = `${title} ${snippet} ${tags.join(" ")}`.toLowerCase();
  const matched = skills.filter((s) => text.includes(s.toLowerCase()));
  const base = Math.round((matched.length / skills.length) * 70);
  return Math.min(base + Math.floor(Math.random() * 20) + 10, 99);
}

function extractTags(snippet: string, title: string, userSkills: string[]): string[] {
  const text = `${title} ${snippet}`.toLowerCase();
  const common = [
    "react","vue","angular","node","python","java","typescript","javascript","go","rust",
    "aws","gcp","azure","docker","kubernetes","postgresql","mongodb","redis","graphql",
    "next.js","django","fastapi","spring","flutter","swift","kotlin","sql",
  ];
  const fromCommon = common.filter((t) => text.includes(t));
  const fromUser = userSkills.filter((s) => text.includes(s.toLowerCase())).map((s) => s.toLowerCase());
  const merged = Array.from(new Set([...fromUser, ...fromCommon])).slice(0, 6);
  return merged;
}

function normaliseCompany(url: string, title: string): string {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    const parts = host.split(".");
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  } catch {
    return title.split(" at ").pop() || "Company";
  }
}

// ── Brave Search ──────────────────────────────────────────────────────────────

async function braveSearch(query: string): Promise<BraveResult[]> {
  if (!BRAVE_API_KEY) {
    console.warn("BRAVE_API_KEY not set — returning mock data");
    return getMockResults(query);
  }

  // 1. Try with freshness: "pw" (past week) first — no country filter for global results
  const params = new URLSearchParams({
    q: query,
    search_lang: "en",
    freshness: "pw",
    count: "10",
  });

  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?${params}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": BRAVE_API_KEY,
        },
        next: { revalidate: 0 },
      }
    );

    if (res.ok) {
      const data = await res.json();
      const results = (data.web?.results || []) as BraveResult[];
      if (results.length > 0) {
        console.log(`Brave returned ${results.length} results (freshness=pw) for: ${query}`);
        return results;
      }
    } else {
      console.warn(`Brave API freshness query failed with status: ${res.status}`);
    }
  } catch (err) {
    console.error(`Brave API freshness query error:`, err);
  }

  // 2. Fallback: try without freshness constraint if no results were found
  console.log(`Retrying query "${query}" without freshness constraint...`);
  const fallbackParams = new URLSearchParams({
    q: query,
    search_lang: "en",
    count: "10",
  });

  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?${fallbackParams}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": BRAVE_API_KEY,
        },
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Brave API fallback error [${res.status}] for query "${query}":`, errText);
      return getMockResults(query);
    }

    const data = await res.json();
    const results = (data.web?.results || []) as BraveResult[];
    console.log(`Brave returned ${results.length} results (no freshness constraint) for: ${query}`);
    return results;
  } catch (err) {
    console.error(`Brave API fallback query error:`, err);
    return getMockResults(query);
  }
}

interface BraveResult {
  title: string;
  url: string;
  description?: string;
  meta_url?: { netloc?: string };
  thumbnail?: { src?: string };
}

// ── Mock data (fallback when no BRAVE_API_KEY) ────────────────────────────────

function getMockResults(query: string): BraveResult[] {
  const platform = Object.keys(PLATFORM_SITES).find((p) => query.includes(p)) || "greenhouse";
  const roles = ["Frontend Developer", "Backend Engineer", "Full Stack Engineer", "React Developer", "Software Engineer"];
  const companies = ["Stripe", "Airbnb", "Notion", "Linear", "Vercel", "Figma", "Loom", "Retool"];

  return Array.from({ length: 8 }, (_, i) => {
    const role = roles[i % roles.length];
    const company = companies[i % companies.length];
    return {
      title: `${role} at ${company}`,
      url: `https://${platform}.io/jobs/${company.toLowerCase()}-${role.toLowerCase().replace(/ /g, "-")}-${i}`,
      description: `${company} is hiring a ${role}. We're looking for someone with React, TypeScript, Node.js experience. Remote friendly. $120k-$180k/yr. Senior level role on a growing team.`,
    };
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const platforms: string[] = body.platforms || ["greenhouse", "lever", "workable", "wellfound"];
  const forceRefresh: boolean = body.forceRefresh || false;

  // Fetch user profile data for query building
  const [profileRes, skillsRes, workRes, eduRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("skills").select("name, category").eq("user_id", user.id),
    supabase.from("work_experiences").select("job_title, company_name").eq("user_id", user.id).limit(3),
    supabase.from("education").select("degree, field_of_study").eq("user_id", user.id).limit(2),
  ]);

  const profile = profileRes.data;
  const skills: string[] = (skillsRes.data || []).map((s: { name: string }) => s.name);
  const latestRole = workRes.data?.[0]?.job_title || profile?.headline || "Software Developer";
  const location = profile?.location || "";
  const jobType = "Remote";

  // Service client for writing (bypasses RLS when inserting on behalf of user)
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const allJobs: JobRow[] = [];

  for (const platform of platforms) {
    // ── Cache check ──
    if (!forceRefresh) {
      const sixHoursAgo = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString();
      const { data: cached } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .eq("platform", platform)
        .gte("fetched_at", sixHoursAgo)
        .order("match_score", { ascending: false })
        .limit(15);

      if (cached && cached.length > 0) {
        allJobs.push(...cached);
        continue;
      }
    }

    // ── Build multiple queries for broader coverage ──
    const searchSkills = selectSearchSkills(skills);
    const primaryQuery = buildQuery(platform, latestRole, skills, jobType);
    
    // Secondary query with alternative skill set for more variety
    const altSkills = searchSkills.slice(3, 6);
    const secondaryQuery = altSkills.length > 0
      ? buildQuery(platform, latestRole, altSkills, jobType)
      : null;

    console.log(`[${platform}] Primary Query: "${primaryQuery}"`);
    if (secondaryQuery) console.log(`[${platform}] Secondary Query: "${secondaryQuery}"`);

    let results: BraveResult[] = [];
    try {
      // Run primary search — global, no country filter
      const primaryResults = await braveSearch(primaryQuery);
      results.push(...primaryResults);

      // Run secondary search for more diverse results if we have alt skills
      if (secondaryQuery && results.length < 8) {
        const secondaryResults = await braveSearch(secondaryQuery);
        results.push(...secondaryResults);
      }
    } catch (err) {
      console.error(`Brave search failed for ${platform}:`, err);
      results = getMockResults(primaryQuery);
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    results = results.filter((r) => {
      if (!r.url || seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    // Delete stale cached jobs for this platform
    await serviceSupabase
      .from("jobs")
      .delete()
      .eq("user_id", user.id)
      .eq("platform", platform);

    // Normalise + insert
    const rows: JobRow[] = results
      .filter((r) => r.url && r.title)
      .map((r) => {
        const snippet = r.description || "";
        const tags = extractTags(snippet, r.title, skills);
        const matchScore = computeMatchScore(skills, r.title, snippet, tags);
        // Extract job location from snippet rather than using user's profile location
        const jobLocation = extractJobLocation(snippet, r.title);
        return {
          user_id: user.id,
          platform,
          title: r.title.replace(/ at .*$/, "").trim(),
          company: r.title.includes(" at ")
            ? r.title.split(" at ").slice(1).join(" at ").trim()
            : normaliseCompany(r.url, r.title),
          company_logo: null,
          location: jobLocation,
          salary: extractSalary(snippet),
          job_type: extractJobType(snippet, r.title),
          experience_level: extractExperienceLevel(snippet, r.title),
          description: snippet.slice(0, 500),
          tags,
          match_score: matchScore,
          job_url: r.url,
          source_url: r.url,
          applied_status: false,
          saved_status: false,
          fetched_at: new Date().toISOString(),
        };
      });

    if (rows.length > 0) {
      const { data: inserted, error: insertError } = await serviceSupabase
        .from("jobs")
        .insert(rows)
        .select();

      if (insertError) {
        console.error("Insert error:", insertError);
        allJobs.push(...rows.map((r, i) => ({ ...r, id: `temp-${platform}-${i}` })));
      } else {
        allJobs.push(...(inserted || []));
      }
    }
  }

  // Sort by match score descending
  allJobs.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

  return NextResponse.json({ jobs: allJobs });
}

interface JobRow {
  id?: string;
  user_id: string;
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
  source_url: string | null;
  applied_status: boolean;
  saved_status: boolean;
  fetched_at: string;
}
