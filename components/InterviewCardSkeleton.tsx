const InterviewCardSkeleton = () => {
    return (
        <div className="card-border w-[360px] max-sm:w-full min-h-96 animate-pulse">
            <div className="card-interview">
                <div className="flex flex-col gap-4">
                    <div className="size-[90px] rounded-full bg-dark-200" />
                    <div className="h-5 w-48 rounded bg-dark-200" />
                    <div className="flex gap-2">
                        <div className="h-5 w-16 rounded-full bg-dark-200" />
                        <div className="h-5 w-20 rounded-full bg-dark-200" />
                    </div>
                    <div className="flex gap-4">
                        <div className="h-4 w-24 rounded bg-dark-200" />
                        <div className="h-4 w-16 rounded bg-dark-200" />
                    </div>
                    <div className="h-4 w-full rounded bg-dark-200" />
                    <div className="h-4 w-3/4 rounded bg-dark-200" />
                </div>
                <div className="flex justify-between items-center mt-4">
                    <div className="flex gap-2">
                        <div className="size-8 rounded-full bg-dark-200" />
                        <div className="size-8 rounded-full bg-dark-200" />
                    </div>
                    <div className="h-9 w-28 rounded-lg bg-dark-200" />
                </div>
            </div>
        </div>
    );
};

export default InterviewCardSkeleton;
