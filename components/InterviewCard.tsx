import dayjs from "dayjs";
import Image from "next/image";
import {getRandomInterviewCover} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import DisplayTechIcons from "@/components/DisplayTechIcons";
import {getFeedbackByInterviewId} from "@/lib/actions/general.action";

const levelColors: Record<string, string> = {
    junior: "bg-success-100/10 text-success-100",
    mid: "bg-primary-200/10 text-primary-200",
    senior: "bg-destructive-100/10 text-destructive-100",
};

const InterviewCard = async ({id, userId, role, type, techstack, level, finalized}: InterviewCardProps) => {
    const feedback = userId && id
        ? await getFeedbackByInterviewId({ interviewId: id, userId })
        : null;

    const normalizedType = /mix/gi.test(type) ? 'Mixed' : type;
    const normalizedLevel = level?.toLowerCase() ?? 'junior';
    const levelColor = levelColors[normalizedLevel] ?? levelColors.junior;
    const formattedDate = dayjs(feedback?.createdAt || Date.now()).format('MMM D, YYYY');

    const status = !finalized ? 'Draft' : feedback ? 'Completed' : 'Not Started';
    const statusColor =
        status === 'Completed' ? 'bg-success-100/10 text-success-100' :
        status === 'Not Started' ? 'bg-light-600/30 text-light-400' :
        'bg-primary-200/10 text-primary-200';

    return (
        <div className="card-border w-[360px] max-sm:w-full min-h-96">
            <div className="card-interview">
                <div>
                    <div className="absolute top-0 right-0 w-fit px-4 py-2 rounded-bl-lg bg-light-600">
                        <p className="badge-text">{normalizedType}</p>
                    </div>

                    <Image
                        src={getRandomInterviewCover()}
                        alt="cover"
                        width={90}
                        height={90}
                        className="rounded-full object-cover size-[90px]"
                    />

                    <h3 className="mt-5 capitalize">{role} Interview</h3>

                    <div className="flex flex-row gap-2 mt-3 flex-wrap">
                        {level && (
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${levelColor}`}>
                                {level}
                            </span>
                        )}
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor}`}>
                            {status}
                        </span>
                    </div>

                    <div className="flex flex-row gap-5 mt-3">
                        <div className="flex flex-row gap-2">
                            <Image src="/calendar.svg" alt="calendar" width={22} height={22} />
                            <p>{formattedDate}</p>
                        </div>
                        <div className="flex flex-row gap-2 items-center">
                            <Image src="/star.svg" alt="star" width={22} height={22} />
                            <p>{feedback?.totalScore ?? '---'}/100</p>
                        </div>
                    </div>

                    <p className="line-clamp-2 mt-5">
                        {feedback?.finalAssessment || "You haven't taken this interview yet. Take it now to improve your skills."}
                    </p>
                </div>

                <div className="flex flex-row justify-between">
                    <DisplayTechIcons techStack={techstack} />
                    <Button className="btn-primary">
                        <Link href={feedback ? `/interview/${id}/feedback` : `/interview/${id}`}>
                            {feedback ? 'Check Feedback' : 'View Interview'}
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
export default InterviewCard;
