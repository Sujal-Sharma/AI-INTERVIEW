"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Question {
    q: string;
    solution: string;
}

interface QuestionCategory {
    name: string;
    questions: Question[];
}

interface CompanyResult {
    company: string;
    role: string;
    level: string;
    companyOverview: string;
    interviewProcess: string;
    categories: QuestionCategory[];
    tips: string[];
    focusAreas: string[];
}

const POPULAR_COMPANIES = ["Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix", "Uber", "Airbnb", "Stripe", "Salesforce", "Adobe", "Oracle"];
const LEVELS = ["Junior", "Mid", "Senior", "Staff", "Principal"];

const CATEGORY_ICONS: Record<string, string> = {
    "Technical / Coding": "💻",
    "Behavioral / Leadership": "🧠",
    "System Design": "🏗️",
    "Role-Specific": "🎯",
};

function QuestionCard({ q, solution, index }: { q: string; solution: string; index: number }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-light-600/20 rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-dark-300/50 transition-colors"
            >
                <span className="bg-primary-200/10 text-primary-100 rounded-lg size-7 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {index + 1}
                </span>
                <p className="text-sm text-light-100 flex-1 leading-relaxed">{q}</p>
                <span className={`text-light-600 text-xs shrink-0 mt-0.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▼</span>
            </button>
            {open && (
                <div className="px-4 pb-4 border-t border-light-600/10">
                    <div className="mt-3 bg-dark-300 rounded-xl p-4 flex flex-col gap-2">
                        <p className="text-xs text-success-100 font-semibold uppercase tracking-wide">Solution & Approach</p>
                        <p className="text-sm text-light-100 leading-relaxed whitespace-pre-line">{solution}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function CompanyQuestionsPage() {
    const [company, setCompany] = useState("");
    const [role, setRole] = useState("");
    const [level, setLevel] = useState("Mid");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CompanyResult | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [invalidMsg, setInvalidMsg] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!company.trim() || !role.trim()) { toast.error("Company and role are required."); return; }
        setLoading(true);
        setResult(null);
        setInvalidMsg(null);
        try {
            const res = await fetch("/api/tools/company-questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ company: company.trim(), role: role.trim(), level }),
            });
            const data = await res.json();

            if (!data.success) {
                if (data.invalidCompany) {
                    setInvalidMsg(data.error);
                } else {
                    toast.error(data.error || "Failed to fetch questions.");
                }
                return;
            }
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
                <p className="text-light-400 mt-1">Real interview questions specific to each company — with detailed solutions and approach guidance.</p>
            </div>

            {/* Form */}
            <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-light-400">Company <span className="text-destructive-100">*</span></label>
                    <input
                        type="text"
                        value={company}
                        onChange={(e) => { setCompany(e.target.value); setInvalidMsg(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                        placeholder="e.g. Google, Razorpay, Swiggy..."
                        className={`bg-dark-300 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-light-600 focus:outline-none transition-colors
                            ${invalidMsg ? "border-destructive-100/60 focus:border-destructive-100" : "border-light-600/30 focus:border-primary-200/50"}`}
                    />

                    {/* Invalid company warning */}
                    {invalidMsg && (
                        <div className="flex items-start gap-2 bg-destructive-100/5 border border-destructive-100/30 rounded-xl px-4 py-3">
                            <span className="text-destructive-100 shrink-0">✗</span>
                            <p className="text-sm text-destructive-100">{invalidMsg}</p>
                        </div>
                    )}

                    {/* Quick picks */}
                    <div className="flex flex-wrap gap-2 mt-1">
                        {POPULAR_COMPANIES.map((c) => (
                            <button
                                key={c}
                                onClick={() => { setCompany(c); setInvalidMsg(null); }}
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
                            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
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
                            Validating &amp; Fetching Questions...
                        </span>
                    ) : "Get Questions"}
                </Button>
            </div>

            {result && (
                <div className="flex flex-col gap-6">
                    {/* Company header */}
                    <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-4">
                        <div className="flex items-start gap-4">
                            <div className="size-12 rounded-xl bg-primary-200/10 border border-primary-200/20 flex items-center justify-center text-2xl shrink-0">
                                🏢
                            </div>
                            <div className="flex flex-col gap-1">
                                <h3 className="text-white font-bold text-lg">{result.company}</h3>
                                <p className="text-primary-200 text-sm font-medium">{result.level} · {result.role}</p>
                                {result.companyOverview && (
                                    <p className="text-sm text-light-400 mt-1 leading-relaxed">{result.companyOverview}</p>
                                )}
                            </div>
                        </div>

                        {result.interviewProcess && (
                            <div className="border-t border-light-600/10 pt-4">
                                <p className="text-xs text-light-600 font-semibold uppercase tracking-wide mb-2">Interview Process</p>
                                <p className="text-sm text-light-100 leading-relaxed">{result.interviewProcess}</p>
                            </div>
                        )}
                    </div>

                    {/* Focus areas */}
                    {result.focusAreas?.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <p className="text-xs text-light-600 font-semibold uppercase tracking-wide">Key Focus Areas</p>
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
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                                    ${activeCategory === cat.name ? "bg-primary-200 text-dark-100" : "bg-dark-200 text-light-400 hover:text-white"}`}
                            >
                                <span>{CATEGORY_ICONS[cat.name] ?? "📋"}</span>
                                {cat.name}
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeCategory === cat.name ? "bg-dark-100/20 text-dark-100" : "bg-dark-300 text-light-600"}`}>
                                    {cat.questions.length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Questions with expandable solutions */}
                    {result.categories?.filter(c => c.name === activeCategory).map((cat) => (
                        <div key={cat.name} className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-3">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">{CATEGORY_ICONS[cat.name] ?? "📋"}</span>
                                <h3 className="text-primary-100">{cat.name}</h3>
                                <span className="text-xs text-light-600 ml-auto">Click a question to see the solution</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                {cat.questions.map((item, i) => (
                                    <QuestionCard key={i} q={item.q} solution={item.solution} index={i} />
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Tips */}
                    {result.tips?.length > 0 && (
                        <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-3">
                            <h3 className="text-yellow-400 text-base">Pro Tips for {result.company}</h3>
                            <ul className="flex flex-col gap-2">
                                {result.tips.map((t, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-light-100">
                                        <span className="text-yellow-400 shrink-0 mt-0.5">💡</span>{t}
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
