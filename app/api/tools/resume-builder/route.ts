import { NextRequest } from "next/server";
import Groq from "groq-sdk";

export const maxDuration = 30;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { resumeText, jobDescription, mode, name, email, phone, linkedin, github } = body;

        if (!jobDescription) {
            return Response.json({ success: false, error: "Job description is required" }, { status: 400 });
        }
        if (mode === "optimize" && (!resumeText || resumeText.length < 50)) {
            return Response.json({ success: false, error: "Resume text is required for optimization mode." }, { status: 400 });
        }

        const systemPrompt = `You are a world-class resume writer who has helped candidates land roles at Google, Amazon, Microsoft, and top startups. You write resumes that are:
1. ATS-optimized: correct keywords, clean structure, standard section headers
2. Human-compelling: strong action verbs, quantified outcomes, clear impact
3. Concise: every word earns its place
4. Industry-standard: follows modern single-page resume conventions

Rules:
- Every bullet point: [Action Verb] + [What you did] + [Tool/Method] + [Measurable Outcome]
- No "responsible for", "helped with", "worked on" — only strong action verbs
- Numbers everywhere: %, $, ms, users, team size, time saved
- Skills section must mirror exact keywords from the JD
- Summary must be 2-3 tight sentences, no fluff`;

        const optimizePrompt = `Optimize this resume for the job description below. Extract real information from the resume — do not invent facts.

EXISTING RESUME:
${resumeText.slice(0, 2200)}

JOB DESCRIPTION:
${jobDescription.slice(0, 1200)}

Return ONLY this JSON (all fields required):
{
  "contactInfo": {
    "name": "<from resume>",
    "email": "<from resume>",
    "phone": "<from resume if present>",
    "linkedin": "<from resume if present>",
    "github": "<from resume if present>",
    "location": "<from resume if present>"
  },
  "summary": "<2-3 sentence ATS-optimized summary tailored to JD, using keywords from JD>",
  "skills": [
    { "category": "<e.g. Languages, Frameworks, Cloud, Tools>", "items": ["<skill>", "<skill>"] }
  ],
  "experience": [
    {
      "title": "<job title>",
      "company": "<company>",
      "location": "<location>",
      "duration": "<e.g. Jun 2023 – Present>",
      "bullets": [
        "<Action Verb> <what> using <tool/tech>, resulting in <metric outcome>",
        "<Action Verb> <what> using <tool/tech>, achieving <metric outcome>"
      ]
    }
  ],
  "projects": [
    {
      "name": "<project name>",
      "link": "<link if present>",
      "tech": "<comma-separated tech stack>",
      "bullets": [
        "<Action Verb> <what> — <metric outcome>",
        "<Action Verb> <what> — <metric outcome>"
      ]
    }
  ],
  "education": [
    {
      "degree": "<degree and field>",
      "institution": "<university>",
      "duration": "<years>",
      "gpa": "<if present>",
      "details": "<relevant coursework or achievements if any>"
    }
  ],
  "certifications": ["<certification name>"],
  "atsKeywordsAdded": ["<JD keyword that was incorporated>"],
  "changesExplanation": "<2-3 sentences on what was changed and why>"
}`;

        const generatePrompt = `Generate a complete, professional resume for this job description.

CANDIDATE DETAILS:
Name: ${name || "[Your Name]"}
Email: ${email || "[your@email.com]"}
Phone: ${phone || "[+1 (XXX) XXX-XXXX]"}
LinkedIn: ${linkedin || "[linkedin.com/in/yourname]"}
GitHub: ${github || "[github.com/yourname]"}

JOB DESCRIPTION:
${jobDescription.slice(0, 1200)}

Return ONLY this JSON (all fields required, make content realistic and strong):
{
  "contactInfo": {
    "name": "${name || "[Your Name]"}",
    "email": "${email || "[your@email.com]"}",
    "phone": "${phone || "[+1 (XXX) XXX-XXXX]"}",
    "linkedin": "${linkedin || "[linkedin.com/in/yourname]"}",
    "github": "${github || "[github.com/yourname]"}",
    "location": "[City, Country]"
  },
  "summary": "<2-3 sentence compelling professional summary using JD keywords>",
  "skills": [
    { "category": "<Languages>", "items": ["<skill>"] },
    { "category": "<Frameworks & Libraries>", "items": ["<skill>"] },
    { "category": "<Cloud & DevOps>", "items": ["<skill>"] },
    { "category": "<Tools & Platforms>", "items": ["<skill>"] }
  ],
  "experience": [
    {
      "title": "<relevant job title>",
      "company": "<Company Name>",
      "location": "<City, Country>",
      "duration": "<Month Year – Month Year>",
      "bullets": [
        "<strong action verb + what + tool + metric outcome>",
        "<strong action verb + what + tool + metric outcome>",
        "<strong action verb + what + tool + metric outcome>"
      ]
    }
  ],
  "projects": [
    {
      "name": "<Project Name>",
      "link": "github.com/yourname/project",
      "tech": "<Tech Stack>",
      "bullets": [
        "<Engineered/Built/Designed> <what> — <metric outcome>",
        "<Engineered/Built/Designed> <what> — <metric outcome>"
      ]
    }
  ],
  "education": [
    {
      "degree": "<Degree> in <Field>",
      "institution": "<University>",
      "duration": "<Year – Year>",
      "gpa": "",
      "details": ""
    }
  ],
  "certifications": [],
  "atsKeywordsAdded": ["<keyword from JD incorporated>"],
  "changesExplanation": "Generated a complete resume tailored to the job description with ATS-optimized keywords and quantified bullet points."
}`;

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: mode === "optimize" ? optimizePrompt : generatePrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.4,
            max_tokens: 3000,
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
