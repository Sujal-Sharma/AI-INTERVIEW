import React, { Suspense } from 'react'
import {Button} from "@/components/ui/button";
import Link from "next/link";
import Image from 'next/image'
import InterviewCard from "@/components/InterviewCard";
import InterviewFilters from "@/components/InterviewFilters";
import {getCurrentUser} from "@/lib/actions/auth.action";
import {getInterviewsByUserId} from "@/lib/actions/general.action"

const Page = async ({ searchParams }: RouteParams) => {
    const user = await getCurrentUser();
    const { level, type } = await searchParams;

    const userInterviews = await getInterviewsByUserId(user?.id ?? '');

    const filterInterviews = (interviews: Interview[] | null) => {
        if (!interviews) return [];
        return interviews.filter(i => {
            const levelMatch = !level || level === 'All' || i.level?.toLowerCase() === level.toLowerCase();
            const typeMatch = !type || type === 'All' || i.type?.toLowerCase().includes(type.toLowerCase());
            return levelMatch && typeMatch;
        });
    };

    const filteredUserInterviews = filterInterviews(userInterviews);
    const hasPastInterviews = filteredUserInterviews.length > 0;

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
        </>
    )
}
export default Page
