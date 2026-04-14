import { getCurrentUser } from "@/lib/actions/auth.action";
import { getUserStats, getFeedbackHistory } from "@/lib/actions/general.action";
import { redirect } from "next/navigation";
import Image from "next/image";
import ScoreChart from "@/components/ScoreChart";

const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
    <div className="flex flex-col gap-1 bg-dark-200 rounded-2xl p-6 flex-1 min-w-[140px]">
        <p className="text-light-400 text-sm">{label}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        {sub && <p className="text-light-400 text-xs">{sub}</p>}
    </div>
);

const ProfilePage = async () => {
    const user = await getCurrentUser();
    if (!user) redirect('/sign-in');

    const [stats, history] = await Promise.all([
        getUserStats(user.id),
        getFeedbackHistory(user.id),
    ]);

    return (
        <div className="flex flex-col gap-8">
            {/* User info */}
            <div className="flex flex-row items-center gap-6">
                <div className="size-20 rounded-full bg-dark-200 flex items-center justify-center overflow-hidden">
                    <Image src="/user-avatar.png" alt="avatar" width={80} height={80} className="rounded-full object-cover" />
                </div>
                <div>
                    <h2>{user.name}</h2>
                    <p className="text-light-400">{user.email}</p>
                </div>
            </div>

            {/* Stats */}
            <section className="flex flex-col gap-4">
                <h3>Your Stats</h3>
                <div className="flex flex-row flex-wrap gap-4">
                    <StatCard label="Total Interviews" value={stats.totalInterviews} />
                    <StatCard label="Completed" value={stats.completedInterviews} />
                    <StatCard
                        label="Average Score"
                        value={stats.averageScore > 0 ? `${stats.averageScore}/100` : '---'}
                    />
                    {stats.strongest && (
                        <StatCard
                            label="Strongest Area"
                            value={stats.strongest.name}
                            sub={`${stats.strongest.average}/100`}
                        />
                    )}
                    {stats.weakest && stats.weakest.name !== stats.strongest?.name && (
                        <StatCard
                            label="Needs Improvement"
                            value={stats.weakest.name}
                            sub={`${stats.weakest.average}/100`}
                        />
                    )}
                </div>
            </section>

            {/* Progress chart */}
            {history.length > 0 && (
                <section className="flex flex-col gap-4">
                    <h3>Score Progress</h3>
                    <div className="bg-dark-200 rounded-2xl p-6">
                        <ScoreChart data={history} />
                    </div>
                </section>
            )}

            {/* Category breakdown */}
            {stats.categoryAverages.length > 0 && (
                <section className="flex flex-col gap-4">
                    <h3>Performance by Category</h3>
                    <div className="flex flex-col gap-3">
                        {stats.categoryAverages.map((cat) => (
                            <div key={cat.name} className="flex flex-col gap-1">
                                <div className="flex justify-between text-sm">
                                    <span>{cat.name}</span>
                                    <span className="text-light-400">{cat.average}/100</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-dark-300">
                                    <div
                                        className="h-2 rounded-full bg-primary-200 transition-all"
                                        style={{ width: `${cat.average}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {stats.completedInterviews === 0 && (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <p className="text-light-400">No interviews completed yet.</p>
                    <p className="text-light-400 text-sm">Take an interview to see your performance stats here.</p>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
