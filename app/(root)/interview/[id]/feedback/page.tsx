import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
    getFeedbackByInterviewId,
    getInterviewById,
    generateStudyPlan,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";
import ShareButton from "@/components/ShareButton";

const Feedback = async ({ params }: RouteParams) => {
    const { id } = await params;
    const user = await getCurrentUser();

    const interview = await getInterviewById(id);
    if (!interview) redirect("/");
    if (!user) redirect("/");

    const feedback = await getFeedbackByInterviewId({
        interviewId: id,
        userId: user.id,
    });

    // Generate study plan from weak areas
    const weakAreas = feedback?.categoryScores
        ?.filter(c => c.score < 70)
        ?.map(c => c.name) ?? [];

    const studyPlan = weakAreas.length > 0
        ? await generateStudyPlan({ weakAreas, role: interview.role })
        : null;

    const shareUrl = `${process.env.NEXT_BASE_URL}/interview/${id}/feedback`;

    return (
        <section className="section-feedback">
            <div className="flex flex-row justify-center">
                <h1 className="text-4xl font-semibold">
                    Feedback on the Interview —{" "}
                    <span className="capitalize">{interview.role}</span> Interview
                </h1>
            </div>

            <div className="flex flex-row justify-center">
                <div className="flex flex-row gap-5 flex-wrap justify-center">
                    <div className="flex flex-row gap-2 items-center">
                        <Image src="/star.svg" width={22} height={22} alt="star" />
                        <p>
                            Overall Impression:{" "}
                            <span className="text-primary-200 font-bold">{feedback?.totalScore}</span>
                            /100
                        </p>
                    </div>
                    <div className="flex flex-row gap-2">
                        <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
                        <p>
                            {feedback?.createdAt
                                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                                : "N/A"}
                        </p>
                    </div>
                    <ShareButton url={shareUrl} />
                </div>
            </div>

            <hr />

            <p>{feedback?.finalAssessment}</p>

            {/* Interview Breakdown */}
            <div className="flex flex-col gap-4">
                <h2>Breakdown of the Interview:</h2>
                {feedback?.categoryScores?.map((category, index) => (
                    <div key={index} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <p className="font-bold">
                                {index + 1}. {category.name}
                            </p>
                            <span className={`text-sm font-semibold px-2 py-0.5 rounded-full
                                ${category.score >= 70 ? 'bg-success-100/10 text-success-100' : 'bg-destructive-100/10 text-destructive-100'}`}>
                                {category.score}/100
                            </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-dark-200">
                            <div
                                className={`h-1.5 rounded-full transition-all ${category.score >= 70 ? 'bg-success-100' : 'bg-destructive-100'}`}
                                style={{ width: `${category.score}%` }}
                            />
                        </div>
                        <p className="text-light-400 text-sm">{category.comment}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3">
                <h3>Strengths</h3>
                <ul>
                    {feedback?.strengths?.map((strength, index) => (
                        <li key={index}>{strength}</li>
                    ))}
                </ul>
            </div>

            <div className="flex flex-col gap-3">
                <h3>Areas for Improvement</h3>
                <ul>
                    {feedback?.areasForImprovement?.map((area, index) => (
                        <li key={index}>{area}</li>
                    ))}
                </ul>
            </div>

            {/* AI Study Plan */}
            {studyPlan?.plan && (
                <div className="flex flex-col gap-4 bg-dark-200 rounded-2xl p-6">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-primary-100">Your 7-Day Study Plan</h3>
                        <p className="text-light-400 text-sm">
                            Personalized plan to improve your weak areas: {weakAreas.join(", ")}
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        {studyPlan.plan.map((day: { day: number; focus: string; tasks: string[] }) => (
                            <div key={day.day} className="flex flex-col gap-1 border-l-2 border-primary-200/30 pl-4">
                                <p className="font-semibold text-sm">
                                    Day {day.day} — <span className="text-primary-200">{day.focus}</span>
                                </p>
                                <ul className="flex flex-col gap-1">
                                    {day.tasks.map((task, i) => (
                                        <li key={i} className="text-light-400 text-sm">• {task}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    {studyPlan.resources && (
                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-semibold text-light-400">Recommended Resources:</p>
                            <ul className="flex flex-col gap-1">
                                {studyPlan.resources.map((r: string, i: number) => (
                                    <li key={i} className="text-light-400 text-sm">• {r}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <div className="buttons">
                <Button className="btn-secondary flex-1">
                    <Link href="/" className="flex w-full justify-center">
                        <p className="text-sm font-semibold text-primary-200 text-center">
                            Back to dashboard
                        </p>
                    </Link>
                </Button>
                <Button className="btn-primary flex-1">
                    <Link href={`/interview/${id}`} className="flex w-full justify-center">
                        <p className="text-sm font-semibold text-black text-center">
                            Retake Interview
                        </p>
                    </Link>
                </Button>
            </div>
        </section>
    );
};

export default Feedback;
