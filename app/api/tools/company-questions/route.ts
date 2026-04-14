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

        // Step 1: Validate company
        const validationRes = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are a company database validator. Respond ONLY with valid JSON. No extra text.",
                },
                {
                    role: "user",
                    content: `Is "${company}" a real company that hires software/tech professionals (startup, enterprise, or well-known tech firm)?

Return ONLY this JSON:
{
  "valid": true or false,
  "reason": "<if invalid: why it's not valid. if valid: one sentence about what the company does>",
  "normalizedName": "<correct spelling/capitalization of the company name if valid, else null>"
}`,
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
            max_tokens: 150,
        });

        const validationRaw = validationRes.choices[0]?.message?.content ?? "{}";
        const validation = JSON.parse(validationRaw);

        if (!validation.valid) {
            return Response.json({
                success: false,
                invalidCompany: true,
                error: `"${company}" doesn't appear to be a recognized company. ${validation.reason || "Please enter a valid company name."}`,
            }, { status: 400 });
        }

        const normalizedCompany = validation.normalizedName || company;

        // Step 2: Generate questions with solutions
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are a senior interview coach who has personally interviewed at and coached candidates for ${normalizedCompany}. You know the EXACT questions this company asks, their evaluation criteria, and what a strong answer looks like. Be specific to ${normalizedCompany}'s culture, tech stack, and values — not generic. Always respond with valid JSON only.`,
                },
                {
                    role: "user",
                    content: `Generate real, company-specific interview questions for a ${level || "Mid"}-level ${role} at ${normalizedCompany}. These must reflect ${normalizedCompany}'s ACTUAL interview style, values, and tech stack — not generic questions.

Return ONLY this JSON:
{
  "company": "${normalizedCompany}",
  "role": "${role}",
  "level": "${level || "Mid"}",
  "companyOverview": "<2 sentences: what ${normalizedCompany} does and what they value in candidates>",
  "interviewProcess": "<step-by-step description of ${normalizedCompany}'s actual interview pipeline for this role — e.g. 'Phone screen → 2 technical rounds → system design → bar raiser'>",
  "categories": [
    {
      "name": "Technical / Coding",
      "questions": [
        {
          "q": "<real technical question specific to ${normalizedCompany}>",
          "solution": "<detailed answer: approach, key concepts, time/space complexity if applicable, what ${normalizedCompany} looks for in the answer>"
        },
        {
          "q": "<real technical question>",
          "solution": "<detailed answer>"
        },
        {
          "q": "<real technical question>",
          "solution": "<detailed answer>"
        },
        {
          "q": "<real technical question>",
          "solution": "<detailed answer>"
        },
        {
          "q": "<real technical question>",
          "solution": "<detailed answer>"
        }
      ]
    },
    {
      "name": "Behavioral / Leadership",
      "questions": [
        {
          "q": "<behavioral question specific to ${normalizedCompany}'s leadership principles or values>",
          "solution": "<how to structure the answer using STAR, what ${normalizedCompany} evaluates, example talking points>"
        },
        {
          "q": "<behavioral question>",
          "solution": "<detailed answer>"
        },
        {
          "q": "<behavioral question>",
          "solution": "<detailed answer>"
        },
        {
          "q": "<behavioral question>",
          "solution": "<detailed answer>"
        }
      ]
    },
    {
      "name": "System Design",
      "questions": [
        {
          "q": "<system design question relevant to ${normalizedCompany}'s actual products or scale>",
          "solution": "<step-by-step design approach: requirements clarification, high-level design, components, trade-offs, how to tailor to ${normalizedCompany}'s scale>"
        },
        {
          "q": "<system design question>",
          "solution": "<detailed answer>"
        },
        {
          "q": "<system design question>",
          "solution": "<detailed answer>"
        }
      ]
    },
    {
      "name": "Role-Specific",
      "questions": [
        {
          "q": "<question specific to ${role} responsibilities at ${normalizedCompany}>",
          "solution": "<what a strong answer includes, key skills to highlight, ${normalizedCompany}-specific context>"
        },
        {
          "q": "<role-specific question>",
          "solution": "<detailed answer>"
        },
        {
          "q": "<role-specific question>",
          "solution": "<detailed answer>"
        }
      ]
    }
  ],
  "tips": [
    "<tip specific to ${normalizedCompany}'s interview style or culture>",
    "<tip specific to ${normalizedCompany}>",
    "<tip specific to ${normalizedCompany}>",
    "<tip specific to ${normalizedCompany}>"
  ],
  "focusAreas": ["<key area ${normalizedCompany} tests>", "<key area>", "<key area>", "<key area>"]
}`,
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.5,
            max_tokens: 3000,
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
