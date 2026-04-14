import { NextRequest } from "next/server";
import Groq from "groq-sdk";

export const maxDuration = 30;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { resumeText, targetRole } = body;

        if (!resumeText || resumeText.length < 50) {
            return Response.json({ success: false, error: "Resume text is required" }, { status: 400 });
        }

        const systemPrompt = `You are a senior technical recruiter and resume coach who has reviewed 10,000+ resumes at FAANG companies. You give honest, specific, actionable feedback. You do NOT give generic advice. Every suggestion references the actual resume content. You are direct and point out real problems.`;

        const userPrompt = `Review this resume${targetRole ? ` for a ${targetRole} role` : ""} with extreme detail. Reference specific lines and sections from the resume.

RESUME:
${resumeText.slice(0, 2800)}

Return ONLY this JSON:
{
  "overallRating": <1-10, strict — 6 is average, 8+ is genuinely strong>,
  "hirabilityVerdict": "<one line: e.g. 'Would pass initial screen at mid-size companies, unlikely at FAANG without improvements'>",
  "summary": "<3 sentences: what this person is, what's strong, what's the single biggest problem>",
  "sectionAnalysis": [
    {
      "section": "<e.g. Summary, Experience, Skills, Projects, Education>",
      "score": <1-10>,
      "currentState": "<what the section currently does well or poorly, citing actual content>",
      "problems": ["<specific problem with evidence from actual text>"],
      "fixes": ["<specific actionable fix>"]
    }
  ],
  "bulletRewrites": [
    {
      "original": "<copy exact bullet from resume>",
      "improved": "<rewritten with: strong action verb + what you did + tool/tech used + measurable outcome>",
      "improvement": "<what changed and why>"
    }
  ],
  "missingElements": ["<something important not in the resume at all, e.g. 'No GitHub link', 'No quantified metrics in project outcomes'>"],
  "skillGaps": ["<skill missing for ${targetRole || "the inferred target role"} based on what's shown>"],
  "keywordsToAdd": ["<specific keyword to add, with context of where>"],
  "formattingIssues": ["<specific formatting problem>"],
  "topStrengths": ["<genuine strength with specific evidence from resume>"],
  "quickWins": ["<change that takes <5 min and meaningfully improves the resume>"],
  "powerVerbAlternatives": [
    { "weak": "<weak verb used in resume>", "strong": ["<better verb 1>", "<better verb 2>"] }
  ]
}`;

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.4,
            max_tokens: 2500,
        });

        const raw = completion.choices[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(raw);

        return Response.json({ success: true, result: parsed }, { status: 200 });
    } catch (error: unknown) {
        console.error("Resume improve error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return Response.json({ success: false, error: message }, { status: 500 });
    }
}
