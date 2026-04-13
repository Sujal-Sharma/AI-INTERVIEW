import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";

const CreateInterviewPage = async () => {
    const user = await getCurrentUser();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h2>Create Your Interview</h2>
                <p className="text-light-400">
                    Tell our AI your role, experience level, tech stack, and how many questions you want.
                    It will generate a custom interview just for you.
                </p>
            </div>

            <div className="flex flex-col gap-4 bg-dark-200 rounded-2xl p-6">
                <div className="flex flex-col gap-1">
                    <h3 className="text-primary-100">How it works</h3>
                    <ul className="text-light-400 text-sm flex flex-col gap-2 mt-2">
                        <li>1. Click <span className="text-white font-medium">Start</span> and speak naturally to the AI</li>
                        <li>2. Tell it your <span className="text-white font-medium">job role</span> (e.g. Frontend Developer)</li>
                        <li>3. Mention your <span className="text-white font-medium">experience level</span> (Junior / Mid / Senior)</li>
                        <li>4. List your <span className="text-white font-medium">tech stack</span> (e.g. React, TypeScript, Node)</li>
                        <li>5. Say how many <span className="text-white font-medium">questions</span> you want (e.g. 5 or 10)</li>
                        <li>6. The AI will generate your interview — it will appear on your dashboard</li>
                    </ul>
                </div>
            </div>

            <Agent userName={user?.name ?? ''} userId={user?.id} type="generate" />
        </div>
    );
};

export default CreateInterviewPage;
