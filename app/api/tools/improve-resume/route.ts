import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { extractText } from "unpdf";

export const maxDuration = 60;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("resume") as File | null;
        const targetRole = (formData.get("targetRole") as string) || "";

        if (!file) {
            return Response.json({ success: false, error: "Resume is required" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const { text: pages } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true });
        const resumeText = Array.isArray(pages) ? pages.join(" ").trim() : String(pages).trim();

        if (!resumeText || resumeText.length < 50) {
            return Response.json({ success: false, error: "Could not extract text from PDF." }, { status: 400 });
        }

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are an expert resume coach and career advisor. Always respond with valid JSON only.",
                },
                {
                    role: "user",
                    content: `Analyze this resume${targetRole ? ` for a ${targetRole} position` : ""} and provide detailed improvement suggestions.

Resume:
${resumeText.slice(0, 2500)}

Return ONLY a JSON object:
{
  "overallRating": <number 1-10>,
  "summary": "<2-3 sentence assessment>",
  "improvements": [
    {
      "section": "<section name>",
      "issue": "<what is wrong>",
      "suggestion": "<specific fix>",
      "priority": "high|medium|low"
    }
  ],
  "bulletPointSuggestions": [
    {
      "original": "<original bullet or phrase from resume>",
      "improved": "<improved version with action verb and metrics>"
    }
  ],
  "skillsToAdd": ["<skill 1>", "<skill 2>", "<skill 3>"],
  "formattingTips": ["<tip 1>", "<tip 2>"],
  "powerWords": ["<word 1>", "<word 2>", "<word 3>", "<word 4>", "<word 5>"]
}`,
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.6,
            max_tokens: 1500,
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
