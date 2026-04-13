'use server'
import {db} from "@/firebase/admin";
import Groq from "groq-sdk";
import {feedbackSchema} from "@/constants";
import {z} from "zod";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function getInterviewsByUserId(userId: string): Promise<Interview[] | null>{
    const interviews = await db
        .collection('interviews')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    })) as Interview[];
}

export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[] | null>{
    const { userId, limit = 20 } = params;
    const interviews = await db
        .collection('interviews')
        .orderBy('createdAt', 'desc')
        .where('finalized', '==', true)
        .where('userId', '!=', userId)
        .limit(limit)
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    })) as Interview[];
}

export async function getInterviewById(id: string): Promise<Interview | null>{
    const interview = await db
        .collection('interviews')
        .doc(id)
        .get();

    if (!interview.exists) return null;

    return { id: interview.id, ...interview.data() } as Interview;
}

export async function createFeedback(params: CreateFeedbackParams) {
    const { interviewId, userId, transcript, feedbackId } = params;

    try {
        const formattedTranscript = transcript
            .map(
                (sentence: { role: string; content: string }) =>
                    `- ${sentence.role}: ${sentence.content}\n`
            )
            .join("");

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Return ONLY valid JSON matching the exact schema provided, with no extra text.",
                },
                {
                    role: "user",
                    content: `You are an AI interviewer analyzing a mock interview. Evaluate the candidate based on structured categories. Be thorough and detailed. Don't be lenient — point out mistakes and areas for improvement.

Transcript:
${formattedTranscript}

Score the candidate from 0 to 100 in these exact categories:
- Communication Skills: Clarity, articulation, structured responses.
- Technical Knowledge: Understanding of key concepts for the role.
- Problem Solving: Ability to analyze problems and propose solutions.
- Cultural Fit: Alignment with company values and job role.
- Confidence and Clarity: Confidence in responses, engagement, and clarity.

Return ONLY a JSON object in this exact format, no other text:
{
  "totalScore": <number 0-100>,
  "categoryScores": [
    {"name": "Communication Skills", "score": <number>, "comment": "<string>"},
    {"name": "Technical Knowledge", "score": <number>, "comment": "<string>"},
    {"name": "Problem Solving", "score": <number>, "comment": "<string>"},
    {"name": "Cultural Fit", "score": <number>, "comment": "<string>"},
    {"name": "Confidence and Clarity", "score": <number>, "comment": "<string>"}
  ],
  "strengths": ["<string>", ...],
  "areasForImprovement": ["<string>", ...],
  "finalAssessment": "<string>"
}`,
                },
            ],
            temperature: 0.7,
            response_format: { type: "json_object" },
        });

        const raw = completion.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(raw);

        const object = feedbackSchema.parse(parsed) as z.infer<typeof feedbackSchema>;

        const feedback = {
            interviewId: interviewId,
            userId: userId,
            totalScore: object.totalScore,
            categoryScores: object.categoryScores,
            strengths: object.strengths,
            areasForImprovement: object.areasForImprovement,
            finalAssessment: object.finalAssessment,
            createdAt: new Date().toISOString(),
        };

        let feedbackRef;

        if (feedbackId) {
            feedbackRef = db.collection("feedback").doc(feedbackId);
        } else {
            feedbackRef = db.collection("feedback").doc();
        }

        await feedbackRef.set(feedback);

        return { success: true, feedbackId: feedbackRef.id };
    } catch (error: unknown) {
        console.error("Error saving feedback:", error);
        return { success: false };
    }
}

export async function getFeedbackByInterviewId(params: GetFeedbackByInterviewIdParams): Promise<Feedback | null>{
    const { interviewId, userId } = params;

    const feedback = await db
        .collection('feedback')
        .where('interviewId', '==', interviewId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

    if(feedback.empty) return null;

    const feedbackDoc = feedback.docs[0];
    return {
        id: feedbackDoc.id, ...feedbackDoc.data()
    } as Feedback;
}
