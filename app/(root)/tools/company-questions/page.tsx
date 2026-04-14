"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface QuestionCategory {
    name: string;
    questions: string[];
}

interface CompanyResult {
    company: string;
    role: string;
    level: string;
    interviewProcess: string;
    categories: QuestionCategory[];
    tips: string[];
    focusAreas: string[];
}

const POPULAR_COMPANIES = ["Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix", "Uber", "Airbnb", "Stripe", "Salesforce", "Adobe", "Oracle"];
const LEVELS = ["Junior", "Mid", "Senior", "Staff", "Principal"];

export default function CompanyQuestionsPage() {
    const [company, setCompany] = useState("");
    const [role, setRole] = useState("");
    const [level, setLevel] = useState("Mid");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CompanyResult | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!company.trim() || !role.trim()) { toast.error("Company and role are required."); return; }
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch("/api/tools/company-questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ company: company.trim(), role: role.trim(), level }),
            });
            const data = await res.json();
            if (!data.success) { toast.error(data.error || "Failed to fetch questions."); return; }
            setResult(data.result);
            setActiveCategory(data.result.categories?.[0]?.name || null);
        } catch {
            toast.error("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
            <div>
                <h2>Company-wise Questions</h2>
                <p className="text-light-400 mt-1">Get the most commonly asked interview questions at specific companies, tailored by role and level.</p>
            </div>

            {/* Form */}
            <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-light-400">Company <span className="text-destructive-100">*</span></label>
                    <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                        placeholder="e.g. Google, Microsoft, Uber..."
                        className="bg-dark-300 border border-light-600/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-light-600 focus:outline-none focus:border-primary-200/50"
                    />
                    {/* Quick picks */}
                    <div className="flex flex-wrap gap-2 mt-1">
                        {POPULAR_COMPANIES.map((c) => (
                            <button
                                key={c}
                                onClick={() => setCompany(c)}
                                className={`px-3 py-1 rounded-full text-xs transition-colors
                                    ${company === c ? "bg-primary-200 text-dark-100" : "bg-dark-300 text-light-400 hover:text-white border border-light-600/20"}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-light-400">Role <span className="text-destructive-100">*</span></label>
                        <input
                            type="text"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            placeholder="e.g. Software Engineer, Data Scientist..."
                            className="bg-dark-300 border border-light-600/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-light-600 focus:outline-none focus:border-primary-200/50"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-light-400">Level</label>
                        <div className="flex flex-wrap gap-2">
                            {LEVELS.map((l) => (
                                <button
                                    key={l}
                                    onClick={() => setLevel(l)}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors
                                        ${level === l ? "bg-primary-200 text-dark-100" : "bg-dark-300 text-light-400 hover:text-white"}`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <Button className="btn-primary" onClick={handleSubmit} disabled={loading || !company.trim() || !role.trim()}>
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Fetching Questions...
                        </span>
                    ) : "Get Questions"}
                </Button>
            </div>

            {result && (
                <div className="flex flex-col gap-6">
                    {/* Header */}
                    <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">🏢</span>
                            <div>
                                <h3 className="text-white">{result.company} — {result.role}</h3>
                                <p className="text-sm text-primary-200">{result.level} Level</p>
                            </div>
                        </div>
                        <p className="text-sm text-light-400">{result.interviewProcess}</p>
                    </div>

                    {/* Focus areas */}
                    {result.focusAreas?.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <p className="text-sm text-light-400">Key Focus Areas</p>
                            <div className="flex flex-wrap gap-2">
                                {result.focusAreas.map((a, i) => (
                                    <span key={i} className="px-3 py-1 bg-primary-200/10 text-primary-100 rounded-full text-sm border border-primary-200/20">{a}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Category tabs */}
                    <div className="flex gap-2 flex-wrap">
                        {result.categories?.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => setActiveCategory(cat.name)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                    ${activeCategory === cat.name ? "bg-primary-200 text-dark-100" : "bg-dark-200 text-light-400 hover:text-white"}`}
                            >
                                {cat.name} ({cat.questions.length})
                            </button>
                        ))}
                    </div>

                    {/* Questions */}
                    {result.categories?.filter(c => c.name === activeCategory).map((cat) => (
                        <div key={cat.name} className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-3">
                            <h3 className="text-primary-100">{cat.name} Questions</h3>
                            <ol className="flex flex-col gap-3">
                                {cat.questions.map((q, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="bg-dark-300 text-light-400 rounded-full size-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                                        <p className="text-sm text-light-100">{q}</p>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    ))}

                    {/* Tips */}
                    {result.tips?.length > 0 && (
                        <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-3">
                            <h3 className="text-primary-100">Pro Tips for {result.company}</h3>
                            <ul className="flex flex-col gap-2">
                                {result.tips.map((t, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-light-100">
                                        <span className="text-yellow-400 mt-0.5">💡</span>{t}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
