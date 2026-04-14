import { NextRequest } from "next/server";
import Groq from "groq-sdk";

export const maxDuration = 30;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { resumeText, jobDescription, mode, name, email } = body;

        if (!jobDescription) {
            return Response.json({ success: false, error: "Job description is required" }, { status: 400 });
        }

        if (mode === "optimize" && (!resumeText || resumeText.length < 50)) {
            return Response.json({ success: false, error: "Resume text is required for optimization mode." }, { status: 400 });
        }

        const userPrompt = mode === "optimize"
            ? `You are an expert ATS resume writer. Optimize the resume below for the given job description.

Resume:
${resumeText.slice(0, 2000)}

Job Description:
${jobDescription.slice(0, 1000)}

Return ONLY a JSON object:
{
  "summary": "<tailored professional summary 3 sentences, ATS-optimized>",
  "keySkills": ["<skill1>", "<skill2>", "<skill3>", "<skill4>", "<skill5>", "<skill6>", "<skill7>", "<skill8>"],
  "tailoredBullets": [
    { "section": "<Experience/Project name from resume>", "bullets": ["<strong action verb + metric bullet>", "<bullet 2>", "<bullet 3>"] }
  ],
  "missingKeywords": ["<JD keyword added to resume>", "<keyword 2>", "<keyword 3>"],
  "fullResumeText": "<complete ATS-optimized resume in structured plain text. Include sections: CONTACT INFO, PROFESSIONAL SUMMARY, TECHNICAL SKILLS, WORK EXPERIENCE (with role, company, dates, 3-4 strong bullet points each), EDUCATION, PROJECTS. Make it detailed enough to fill a full page.>"
}`
            : `You are an expert ATS resume writer. Generate a complete professional resume for this job description.

${name ? `Candidate Name: ${name}` : "Candidate Name: [Your Name]"}
${email ? `Email: ${email}` : "Email: [your@email.com]"}

Job Description:
${jobDescription.slice(0, 1000)}

Return ONLY a JSON object:
{
  "summary": "<compelling professional summary 3 sentences tailored to the JD>",
  "keySkills": ["<skill1>", "<skill2>", "<skill3>", "<skill4>", "<skill5>", "<skill6>", "<skill7>", "<skill8>"],
  "fullResumeText": "<complete ATS-optimized resume in structured plain text. Include sections: CONTACT INFO (with name, email, LinkedIn placeholder, GitHub placeholder), PROFESSIONAL SUMMARY (3 sentences), TECHNICAL SKILLS (categorized), WORK EXPERIENCE (2-3 relevant positions with strong bullets using action verbs and metrics), EDUCATION, PROJECTS (2-3 relevant projects). Each section should be detailed and keyword-rich. Format cleanly so it fills a full page.>"
}`;

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "You are an expert ATS resume writer. Always respond with valid JSON only. Never truncate the fullResumeText field — it must be complete." },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.5,
            max_tokens: 2500,
        });

        const raw = completion.choices[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(raw);

        return Response.json({ success: true, result: parsed, mode }, { status: 200 });
    } catch (error: unknown) {
        console.error("Resume builder error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return Response.json({ success: false, error: message }, { status: 500 });
    }
}
