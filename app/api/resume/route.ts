import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import pdf from "pdf-parse/lib/pdf-parse";

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

        // Parse PDF
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const pdfData = await pdf(buffer);
        const resumeText = pdfData.text?.trim();

        if (!resumeText || resumeText.length < 50) {
            return Response.json({ success: false, error: "Could not extract text from PDF. Make sure it is not a scanned image." }, { status: 400 });
        }

        // Extract resume info + generate questions
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
${resumeText.slice(0, 4000)}

Return ONLY a JSON object in this exact format:
{
  "role": "<inferred job role from resume>",
  "level": "<Junior|Mid|Senior based on years of experience>",
  "techstack": ["<tech1>", "<tech2>", "<tech3>"],
  "questions": ["<question 1>", "<question 2>", ...]
}

Rules:
- Questions must be specific to the candidate's actual experience, projects, and skills
- Mix technical and behavioral questions
- Do not use special characters like * or / that would break a voice assistant
- The questions array must have exactly ${amount} questions`
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
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
