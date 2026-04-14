import { NextRequest } from "next/server";
import Groq from "groq-sdk";

export const maxDuration = 30;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { company, role, level } = body;

        if (!company || !role) {
            return Response.json({ success: false, error: "Company and role are required" }, { status: 400 });
        }

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are an expert technical recruiter with deep knowledge of hiring processes at top tech companies. Always respond with valid JSON only.",
                },
                {
                    role: "user",
                    content: `Generate the most commonly asked interview questions at ${company} for a ${level || "Mid"} ${role} position.

Return ONLY a JSON object:
{
  "company": "${company}",
  "role": "${role}",
  "level": "${level || "Mid"}",
  "interviewProcess": "<2-3 sentence description of ${company}'s interview process>",
  "categories": [
    {
      "name": "Technical",
      "questions": ["<question 1>", "<question 2>", "<question 3>", "<question 4>", "<question 5>"]
    },
    {
      "name": "Behavioral",
      "questions": ["<question 1>", "<question 2>", "<question 3>"]
    },
    {
      "name": "System Design",
      "questions": ["<question 1>", "<question 2>", "<question 3>"]
    },
    {
      "name": "Role-Specific",
      "questions": ["<question 1>", "<question 2>", "<question 3>"]
    }
  ],
  "tips": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "focusAreas": ["<area 1>", "<area 2>", "<area 3>"]
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
        console.error("Company questions error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return Response.json({ success: false, error: message }, { status: 500 });
    }
}
