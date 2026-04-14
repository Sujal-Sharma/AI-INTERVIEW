import { NextRequest } from "next/server";
import Groq from "groq-sdk";

export const maxDuration = 30;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { resumeText, question } = body;

        if (!question) {
            return Response.json({ success: false, error: "Question is required" }, { status: 400 });
        }

        if (!resumeText || resumeText.length < 50) {
            return Response.json({ success: false, error: "Resume text is required" }, { status: 400 });
        }

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are a career advisor with deep knowledge of the candidate's resume. Answer questions about the candidate's background, skills, and experience based ONLY on the resume provided. Be specific and reference actual details from the resume.

Resume:
${resumeText.slice(0, 2500)}`,
                },
                {
                    role: "user",
                    content: question,
                }
            ],
            temperature: 0.7,
            max_tokens: 600,
        });

        const answer = completion.choices[0]?.message?.content ?? "";

        return Response.json({ success: true, answer }, { status: 200 });
    } catch (error: unknown) {
        console.error("Resume QA error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return Response.json({ success: false, error: message }, { status: 500 });
    }
}
