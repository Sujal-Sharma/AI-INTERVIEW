import React, { Suspense } from 'react'
import {Button} from "@/components/ui/button";
import Link from "next/link";
import Image from 'next/image'
import InterviewCard from "@/components/InterviewCard";
import InterviewCardSkeleton from "@/components/InterviewCardSkeleton";
import InterviewFilters from "@/components/InterviewFilters";
import {getCurrentUser} from "@/lib/actions/auth.action";
import {getInterviewsByUserId, getLatestInterviews} from "@/lib/actions/general.action"

const Page = async ({ searchParams }: RouteParams) => {
    const user = await getCurrentUser();
    const { level, type } = await searchParams;

    const [userInterviews, latestInterviews] = await Promise.all([
        getInterviewsByUserId(user?.id ?? ''),
        getLatestInterviews({ userId: user?.id ?? '' })
    ]);

    const filterInterviews = (interviews: Interview[] | null) => {
        if (!interviews) return [];
        return interviews.filter(i => {
            const levelMatch = !level || level === 'All' || i.level?.toLowerCase() === level.toLowerCase();
            const typeMatch = !type || type === 'All' || i.type?.toLowerCase().includes(type.toLowerCase());
            return levelMatch && typeMatch;
        });
    };

    const filteredUserInterviews = filterInterviews(userInterviews);
    const filteredLatestInterviews = filterInterviews(latestInterviews);

    const hasPastInterviews = filteredUserInterviews.length > 0;
    const hasUpcomingInterviews = filteredLatestInterviews.length > 0;

    return (
        <>
            <section className="card-cta">
                <div className="flex flex-col gap-6 max-w-lg">
                    <h2>Get Interview Ready with AI-Powered Practice & Feedback</h2>
                    <p className="text-lg">
                        Create a custom interview, practise with AI, and get instant feedback
                    </p>
                    <div className="flex gap-3 flex-wrap">
                        <Button asChild className="btn-primary max-sm:w-full">
                            <Link href="/interview/create">Create Interview</Link>
                        </Button>
                        <Button asChild className="btn-secondary max-sm:w-full">
                            <Link href="/interview/resume">Upload Resume</Link>
                        </Button>
                    </div>
                </div>
                <Image src="/robot.png" alt="robo-dude" width={400} height={400} className="max-sm:hidden" />
            </section>

            <section className="flex flex-col gap-6 mt-8">
                <div className="flex flex-col gap-4">
                    <h2>Your Interviews</h2>
                    <Suspense fallback={null}>
                        <InterviewFilters />
                    </Suspense>
                </div>
                <div className="interviews-section">
                    {hasPastInterviews ? (
                        filteredUserInterviews.map((interview) => (
                            <InterviewCard {...interview} userId={user?.id} key={interview.id} />
                        ))
                    ) : (
                        <div className="flex flex-col items-center gap-4 py-10 w-full">
                            {(userInterviews?.length ?? 0) === 0 ? (
                                <>
                                    <p className="text-light-400">You have not created any interviews yet.</p>
                                    <Button asChild className="btn-primary">
                                        <Link href="/interview/create">Create your first interview</Link>
                                    </Button>
                                </>
                            ) : (
                                <p className="text-light-400">No interviews match the selected filters.</p>
                            )}
                        </div>
                    )}
                </div>
            </section>

            <section className="flex flex-col gap-6 mt-8">
                <h2>Sample Interviews</h2>
                <p className="text-light-400 -mt-3 text-sm">Try interviews created by other users to practise</p>
                <div className="interviews-section">
                    {hasUpcomingInterviews ? (
                        filteredLatestInterviews.map((interview) => (
                            <InterviewCard {...interview} key={interview.id} />
                        ))
                    ) : (
                        <p className="text-light-400">No sample interviews available yet.</p>
                    )}
                </div>
            </section>
        </>
    )
}
export default Page
