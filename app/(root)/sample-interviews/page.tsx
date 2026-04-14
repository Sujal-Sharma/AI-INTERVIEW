import React, { Suspense } from 'react'
import InterviewCard from "@/components/InterviewCard";
import InterviewFilters from "@/components/InterviewFilters";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getLatestInterviews } from "@/lib/actions/general.action";

const SampleInterviewsPage = async ({ searchParams }: RouteParams) => {
    const user = await getCurrentUser();
    const { level, type } = await searchParams;

    const latestInterviews = await getLatestInterviews({ userId: user?.id ?? '' });

    const filterInterviews = (interviews: Interview[] | null) => {
        if (!interviews) return [];
        return interviews.filter(i => {
            const levelMatch = !level || level === 'All' || i.level?.toLowerCase() === level.toLowerCase();
            const typeMatch = !type || type === 'All' || i.type?.toLowerCase().includes(type.toLowerCase());
            return levelMatch && typeMatch;
        });
    };

    const filteredInterviews = filterInterviews(latestInterviews);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h2>Sample Interviews</h2>
                <p className="text-light-400 text-sm">Try interviews created by other users to practise for your next job.</p>
            </div>

            <Suspense fallback={null}>
                <InterviewFilters basePath="/sample-interviews" />
            </Suspense>

            <div className="interviews-section">
                {filteredInterviews.length > 0 ? (
                    filteredInterviews.map((interview) => (
                        <InterviewCard {...interview} key={interview.id} />
                    ))
                ) : (
                    <p className="text-light-400">
                        {(latestInterviews?.length ?? 0) === 0
                            ? "No sample interviews available yet."
                            : "No interviews match the selected filters."}
                    </p>
                )}
            </div>
        </div>
    );
};

export default SampleInterviewsPage;
