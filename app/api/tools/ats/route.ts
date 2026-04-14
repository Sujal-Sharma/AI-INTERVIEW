import { NextRequest } from "next/server";
import Groq from "groq-sdk";

export const maxDuration = 30;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { resumeText, jobDescription } = body;

        if (!resumeText || resumeText.length < 50) {
            return Response.json({ success: false, error: "Resume text is required" }, { status: 400 });
        }

        const jdSection = jobDescription
            ? `\n\nJOB DESCRIPTION TO MATCH AGAINST:\n${jobDescription.slice(0, 1500)}`
            : "";

        const systemPrompt = `You are a brutally honest, senior ATS engineer who has built resume screening systems at LinkedIn, Greenhouse, and Lever. You score resumes STRICTLY — most resumes score 40-65. Only truly exceptional, perfectly optimized resumes score above 80. A resume with no JD scores against general industry standards.

SCORING RULES (apply all of these strictly):
- Deduct heavily for: vague bullet points without metrics, missing quantified achievements, generic summaries, no LinkedIn/GitHub URL, no phone number, missing keywords from JD, skills not demonstrated in experience, education-only candidates with no internships, passive language ("responsible for", "helped with", "worked on")
- Deduct moderately for: inconsistent date formats, bullets starting with same verb, skills listed but never mentioned in experience, overuse of buzzwords without substance
- Give credit ONLY for: specific metrics (%, $, time saved, users, scale), strong action verbs (Engineered, Architected, Reduced, Increased), JD keyword matches, quantified impact, clear career progression
- KEYWORD SCORE: Count exact matches between resume and JD. If no JD provided, check against common industry terms. Below 60% match = score under 60.
- FORMAT SCORE: Check for ATS-parseable structure. Tables, columns, graphics = penalize. Missing sections = penalize.
- Scoring is RELATIVE: Compare to thousands of real resumes. Average is 50. Good is 65. Excellent is 78+.`;

        const userPrompt = `Analyze this resume using strict ATS scoring criteria. Be harsh and accurate — do not inflate scores.

RESUME:
${resumeText.slice(0, 2800)}${jdSection}

${jobDescription ? "Score against the provided job description. Count exact keyword matches." : "Score against general software/tech industry ATS standards."}

Return ONLY this JSON (no markdown, no explanation):
{
  "overallScore": <integer 0-100, STRICTLY scored — average resume is 45-60>,
  "matchRate": <if JD provided: percentage of JD keywords found in resume, else null>,
  "scoreBreakdown": {
    "keywordMatch": { "score": <0-100>, "weight": 40, "detail": "<exact keywords found vs missing>" },
    "quantifiedAchievements": { "score": <0-100>, "weight": 20, "detail": "<how many bullets have metrics/numbers>" },
    "formatting": { "score": <0-100>, "weight": 15, "detail": "<ATS parse-ability, section headers, structure>" },
    "relevantExperience": { "score": <0-100>, "weight": 15, "detail": "<years, role alignment, progression>" },
    "education": { "score": <0-100>, "weight": 10, "detail": "<degree relevance, GPA if present, certifications>" }
  },
  "foundKeywords": ["<keyword actually in resume>"],
  "missingKeywords": ["<important keyword NOT in resume, especially from JD>"],
  "hardSkillsFound": ["<specific technical skill from resume>"],
  "softSkillsFound": ["<soft skill from resume>"],
  "redFlags": ["<specific problem: e.g. 'Bullet point: worked on React — no metric or outcome'>"],
  "strengths": ["<specific strength with evidence from resume>"],
  "improvements": [
    {
      "priority": "critical|high|medium",
      "section": "<section name>",
      "issue": "<exact problem>",
      "fix": "<exact action to take>"
    }
  ],
  "rewrittenBullets": [
    {
      "original": "<exact weak bullet from resume>",
      "rewritten": "<stronger version with action verb + metric + outcome>",
      "reason": "<why this is better>"
    }
  ],
  "summary": "<3-sentence honest assessment: current standing, main weaknesses, potential with fixes>"
}`;

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
            max_tokens: 2000,
        });

        const raw = completion.choices[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(raw);

        return Response.json({ success: true, result: parsed }, { status: 200 });
    } catch (error: unknown) {
        console.error("ATS check error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return Response.json({ success: false, error: message }, { status: 500 });
    }
}
