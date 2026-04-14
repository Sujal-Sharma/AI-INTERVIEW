import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { extractText } from "unpdf";

export const maxDuration = 60;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("resume") as File | null;
        const userId = formData.get("userId") as string;
        const type = (formData.get("type") as string) || "mixed";
        const amount = parseInt(formData.get("amount") as string) || 5;

        if (!file || !userId) {
            return Response.json({ success: false, error: "Resume and userId are required" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const { text: pages } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true });
        const resumeText = Array.isArray(pages) ? pages.join(" ").trim() : String(pages).trim();

        if (!resumeText || resumeText.length < 50) {
            return Response.json({ success: false, error: "Could not extract text from PDF. Make sure it is not a scanned image." }, { status: 400 });
        }

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are an expert technical interviewer. Analyze resumes and generate targeted interview questions. Always respond with valid JSON only.",
                },
                {
                    role: "user",
                    content: `Analyze this resume and generate ${amount} interview questions tailored specifically to this candidate's experience and skills.

Resume:
${resumeText.slice(0, 3000)}

Return ONLY a JSON object:
{
  "role": "<inferred job role>",
  "level": "<Junior|Mid|Senior>",
  "techstack": ["<tech1>", "<tech2>", "<tech3>"],
  "questions": ["<question 1>", "<question 2>", ...]
}

Rules:
- Questions specific to candidate's actual experience and projects
- No special characters like * or / (will be read by voice assistant)
- Exactly ${amount} questions`
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 1024,
        });

        const raw = completion.choices[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(raw);

        if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
            return Response.json({ success: false, error: "Failed to generate questions from resume" }, { status: 500 });
        }

        const interview = {
            role: parsed.role || "Software Developer",
            level: parsed.level || "Mid",
            type,
            techstack: parsed.techstack || [],
            questions: parsed.questions,
            userId,
            finalized: true,
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString(),
            fromResume: true,
        };

        const docRef = await db.collection("interviews").add(interview);
        return Response.json({ success: true, interviewId: docRef.id }, { status: 200 });
    } catch (error: unknown) {
        console.error("Resume upload error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return Response.json({ success: false, error: message }, { status: 500 });
    }
}
