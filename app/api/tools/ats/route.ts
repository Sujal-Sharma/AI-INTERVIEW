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

        const prompt = jobDescription
            ? `Analyze this resume against the job description and provide an ATS score.\n\nResume:\n${resumeText.slice(0, 2500)}\n\nJob Description:\n${jobDescription.slice(0, 1000)}`
            : `Analyze this resume and provide a general ATS compatibility score.\n\nResume:\n${resumeText.slice(0, 2500)}`;

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are an expert ATS (Applicant Tracking System) analyzer. Always respond with valid JSON only.",
                },
                {
                    role: "user",
                    content: `${prompt}

Return ONLY a JSON object:
{
  "overallScore": <number 0-100>,
  "sections": {
    "keywords": <number 0-100>,
    "formatting": <number 0-100>,
    "experience": <number 0-100>,
    "skills": <number 0-100>,
    "education": <number 0-100>
  },
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "missingKeywords": ["<keyword 1>", "<keyword 2>", "<keyword 3>"],
  "recommendations": ["<action 1>", "<action 2>", "<action 3>"],
  "summary": "<2-sentence overall assessment>"
}`,
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.5,
            max_tokens: 1024,
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
