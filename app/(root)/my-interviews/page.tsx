import React, { Suspense } from 'react'
import { Button } from "@/components/ui/button";
import Link from "next/link";
import InterviewCard from "@/components/InterviewCard";
import InterviewFilters from "@/components/InterviewFilters";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getInterviewsByUserId, getFeedbackByInterviewId } from "@/lib/actions/general.action";

const MyInterviewsPage = async ({ searchParams }: RouteParams) => {
    const user = await getCurrentUser();
    const { level, type, tab } = await searchParams;
    const activeTab = tab === "completed" ? "completed" : "current";

    const userInterviews = await getInterviewsByUserId(user?.id ?? '');

    // Check which interviews have feedback (completed)
    const interviewsWithStatus = await Promise.all(
        (userInterviews ?? []).map(async (interview) => {
            const feedback = user?.id
                ? await getFeedbackByInterviewId({ interviewId: interview.id, userId: user.id })
                : null;
            return { ...interview, hasCompleted: !!feedback };
        })
    );

    const currentInterviews = interviewsWithStatus.filter(i => !i.hasCompleted);
    const completedInterviews = interviewsWithStatus.filter(i => i.hasCompleted);

    const filterList = (interviews: typeof interviewsWithStatus) =>
        interviews.filter(i => {
            const levelMatch = !level || level === 'All' || i.level?.toLowerCase() === level.toLowerCase();
            const typeMatch = !type || type === 'All' || i.type?.toLowerCase().includes(type.toLowerCase());
            return levelMatch && typeMatch;
        });

    const displayList = filterList(activeTab === "completed" ? completedInterviews : currentInterviews);

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2>My Interviews</h2>
                    <p className="text-light-400 text-sm mt-1">Track your current and completed interview sessions</p>
                </div>
                <div className="flex gap-3">
                    <Button asChild className="btn-primary">
                        <Link href="/interview/create">+ Voice Interview</Link>
                    </Button>
                    <Button asChild className="btn-secondary">
                        <Link href="/interview/resume">+ Resume Interview</Link>
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-light-600/20 pb-0">
                <Link
                    href="/my-interviews?tab=current"
                    className={`px-5 py-2.5 text-sm font-medium rounded-t-xl border-b-2 transition-colors
                        ${activeTab === "current"
                            ? "border-primary-200 text-primary-100 bg-primary-200/5"
                            : "border-transparent text-light-400 hover:text-white"
                        }`}
                >
                    Current
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs
                        ${activeTab === "current" ? "bg-primary-200 text-dark-100" : "bg-dark-200 text-light-400"}`}>
                        {currentInterviews.length}
                    </span>
                </Link>
                <Link
                    href="/my-interviews?tab=completed"
                    className={`px-5 py-2.5 text-sm font-medium rounded-t-xl border-b-2 transition-colors
                        ${activeTab === "completed"
                            ? "border-success-100 text-success-100 bg-success-100/5"
                            : "border-transparent text-light-400 hover:text-white"
                        }`}
                >
                    Completed
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs
                        ${activeTab === "completed" ? "bg-success-100 text-dark-100" : "bg-dark-200 text-light-400"}`}>
                        {completedInterviews.length}
                    </span>
                </Link>
            </div>

            {/* Filters */}
            <Suspense fallback={null}>
                <InterviewFilters basePath={`/my-interviews?tab=${activeTab}`} />
            </Suspense>

            {/* List */}
            <div className="interviews-section">
                {displayList.length > 0 ? (
                    displayList.map((interview) => (
                        <InterviewCard {...interview} userId={user?.id} key={interview.id} />
                    ))
                ) : (
                    <div className="flex flex-col items-center gap-4 py-12 w-full text-center">
                        {(userInterviews?.length ?? 0) === 0 ? (
                            <>
                                <p className="text-light-400 text-lg">You have not created any interviews yet.</p>
                                <p className="text-light-400 text-sm">Start with a voice interview or upload your resume.</p>
                                <div className="flex gap-3 mt-2">
                                    <Button asChild className="btn-primary">
                                        <Link href="/interview/create">Create Voice Interview</Link>
                                    </Button>
                                    <Button asChild className="btn-secondary">
                                        <Link href="/interview/resume">Upload Resume</Link>
                                    </Button>
                                </div>
                            </>
                        ) : activeTab === "completed" ? (
                            <>
                                <p className="text-light-400">No completed interviews yet.</p>
                                <p className="text-light-400 text-sm">Take an interview to see it here once finished.</p>
                            </>
                        ) : (
                            <p className="text-light-400">No interviews match the selected filters.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyInterviewsPage;
