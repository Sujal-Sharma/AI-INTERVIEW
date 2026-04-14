import { getCurrentUser } from "@/lib/actions/auth.action";
import ResumeUploadForm from "@/components/ResumeUploadForm";

const ResumeInterviewPage = async () => {
    const user = await getCurrentUser();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h2>Resume-Based Interview</h2>
                <p className="text-light-400">
                    Upload your resume and we will generate interview questions tailored specifically to your experience, skills, and projects.
                </p>
            </div>
            <ResumeUploadForm userId={user?.id ?? ''} />
        </div>
    );
};

export default ResumeInterviewPage;
