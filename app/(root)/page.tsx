import React from 'react'
import {Button} from "@/components/ui/button";
import Link from "next/link";
import Image from 'next/image'
import InterviewCard from "@/components/InterviewCard";
import InterviewCardSkeleton from "@/components/InterviewCardSkeleton";
import {getCurrentUser} from "@/lib/actions/auth.action";
import {getInterviewsByUserId, getLatestInterviews} from "@/lib/actions/general.action"
import { Suspense } from "react";

const Page = async () => {
    const user = await getCurrentUser();

    const [userInterviews, latestInterviews] = await Promise.all([
        getInterviewsByUserId(user?.id ?? ''),
        getLatestInterviews({ userId: user?.id ?? '' })
    ]);

    const hasPastInterviews = (userInterviews?.length ?? 0) > 0;
    const hasUpcomingInterviews = (latestInterviews?.length ?? 0) > 0;

    return (
        <>
            <section className="card-cta">
                <div className="flex flex-col gap-6 max-w-lg">
                    <h2>Get Interview Ready with AI-Powered Practice & Feedback</h2>
                    <p className="text-lg">
                        Create a custom interview, practise with AI, and get instant feedback
                    </p>
                    <Button asChild className="btn-primary max-sm:w-full">
                        <Link href="/interview/create">Create Interview</Link>
                    </Button>
                </div>
                <Image src="/robot.png" alt="robo-dude" width={400} height={400} className="max-sm:hidden" />
            </section>

            <section className="flex flex-col gap-6 mt-8">
                <h2>Your Interviews</h2>
                <div className="interviews-section">
                    {hasPastInterviews ? (
                        userInterviews?.map((interview) => (
                            <InterviewCard {...interview} userId={user?.id} key={interview.id} />
                        ))
                    ) : (
                        <div className="flex flex-col items-center gap-4 py-10 w-full">
                            <p className="text-light-400">You have not created any interviews yet.</p>
                            <Button asChild className="btn-primary">
                                <Link href="/interview/create">Create your first interview</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            <section className="flex flex-col gap-6 mt-8">
                <h2>Sample Interviews</h2>
                <p className="text-light-400 -mt-3 text-sm">Try interviews created by other users to practise</p>
                <div className="interviews-section">
                    {hasUpcomingInterviews ? (
                        latestInterviews?.map((interview) => (
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
