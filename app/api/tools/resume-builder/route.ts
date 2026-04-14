import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { extractText } from "unpdf";

export const maxDuration = 60;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("resume") as File | null;
        const jobDescription = (formData.get("jobDescription") as string) || "";
        const mode = (formData.get("mode") as string) || "optimize"; // "optimize" | "generate"
        const name = (formData.get("name") as string) || "";
        const email = (formData.get("email") as string) || "";

        if (!jobDescription) {
            return Response.json({ success: false, error: "Job description is required" }, { status: 400 });
        }

        let resumeText = "";
        if (file) {
            const arrayBuffer = await file.arrayBuffer();
            const { text: pages } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true });
            resumeText = Array.isArray(pages) ? pages.join(" ").trim() : String(pages).trim();
        }

        if (mode === "optimize" && (!resumeText || resumeText.length < 50)) {
            return Response.json({ success: false, error: "Resume is required for optimization mode." }, { status: 400 });
        }

        const systemPrompt = "You are an expert resume writer. Always respond with valid JSON only.";

        const userPrompt = mode === "optimize"
            ? `Optimize this resume for the job description below. Rewrite bullet points, highlight relevant skills, and tailor the summary.

Resume:
${resumeText.slice(0, 2000)}

Job Description:
${jobDescription.slice(0, 1000)}

Return ONLY a JSON object:
{
  "summary": "<tailored professional summary 2-3 sentences>",
  "keySkills": ["<skill1>", "<skill2>", "<skill3>", "<skill4>", "<skill5>", "<skill6>"],
  "tailoredBullets": [
    { "section": "<Experience/Project name>", "bullets": ["<bullet 1>", "<bullet 2>"] }
  ],
  "missingKeywords": ["<keyword to add>"],
  "fullResumeText": "<complete optimized resume in plain text format with sections: Summary, Skills, Experience, Education>"
}`
            : `Generate a professional resume for someone applying to this job.

${name ? `Candidate Name: ${name}` : ""}
${email ? `Email: ${email}` : ""}

Job Description:
${jobDescription.slice(0, 1000)}

Return ONLY a JSON object:
{
  "summary": "<professional summary 2-3 sentences>",
  "keySkills": ["<skill1>", "<skill2>", "<skill3>", "<skill4>", "<skill5>", "<skill6>"],
  "fullResumeText": "<complete resume template in plain text with sections: Contact, Summary, Skills, Experience (with placeholder bullets), Education, Projects>"
}`;

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.6,
            max_tokens: 2000,
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
