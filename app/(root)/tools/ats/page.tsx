"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ScoreBreakdownItem {
    score: number;
    weight: number;
    detail: string;
}

interface Improvement {
    priority: "critical" | "high" | "medium";
    section: string;
    issue: string;
    fix: string;
}

interface RewrittenBullet {
    original: string;
    rewritten: string;
    reason: string;
}

interface ATSResult {
    overallScore: number;
    matchRate: number | null;
    scoreBreakdown: Record<string, ScoreBreakdownItem>;
    foundKeywords: string[];
    missingKeywords: string[];
    hardSkillsFound: string[];
    softSkillsFound: string[];
    redFlags: string[];
    strengths: string[];
    improvements: Improvement[];
    rewrittenBullets: RewrittenBullet[];
    summary: string;
}

type Step = "upload" | "extracting" | "ready" | "analyzing" | "done";

const priorityColors = {
    critical: "border-destructive-100/50 bg-destructive-100/5",
    high: "border-yellow-400/50 bg-yellow-400/5",
    medium: "border-light-600/30 bg-dark-300",
};
const priorityBadge = {
    critical: "bg-destructive-100 text-white",
    high: "bg-yellow-400 text-dark-100",
    medium: "bg-dark-300 text-light-400",
};

function ScoreRing({ score }: { score: number }) {
    const color = score >= 75 ? "#49de50" : score >= 55 ? "#facc15" : "#f75353";
    const r = 52;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 100) * circ;
    return (
        <div className="relative size-36 flex items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" width="144" height="144" viewBox="0 0 144 144">
                <circle cx="72" cy="72" r={r} fill="none" stroke="#27282f" strokeWidth="10" />
                <circle cx="72" cy="72" r={r} fill="none" stroke={color} strokeWidth="10"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
            </svg>
            <div className="flex flex-col items-center">
                <span className="text-4xl font-black" style={{ color }}>{score}</span>
                <span className="text-xs text-light-400">/ 100</span>
            </div>
        </div>
    );
}

function WeightedBar({ label, item }: { label: string; item: ScoreBreakdownItem }) {
    const color = item.score >= 75 ? "bg-success-100" : item.score >= 55 ? "bg-yellow-400" : "bg-destructive-100";
    const friendlyLabel: Record<string, string> = {
        keywordMatch: "Keyword Match",
        quantifiedAchievements: "Quantified Achievements",
        formatting: "Formatting & Structure",
        relevantExperience: "Relevant Experience",
        education: "Education & Certs",
    };
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{friendlyLabel[label] ?? label}</span>
                    <span className="text-xs text-light-600 bg-dark-300 px-2 py-0.5 rounded-full">weight {item.weight}%</span>
                </div>
                <span className="font-bold" style={{ color: item.score >= 75 ? "#49de50" : item.score >= 55 ? "#facc15" : "#f75353" }}>
                    {item.score}/100
                </span>
            </div>
            <div className="h-2.5 bg-dark-300 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${item.score}%` }} />
            </div>
            {item.detail && <p className="text-xs text-light-400 leading-relaxed">{item.detail}</p>}
        </div>
    );
}

export default function ATSPage() {
    const [file, setFile] = useState<File | null>(null);
    const [resumeText, setResumeText] = useState("");
    const [jd, setJd] = useState("");
    const [step, setStep] = useState<Step>("upload");
    const [result, setResult] = useState<ATSResult | null>(null);
    const [dragging, setDragging] = useState(false);

    const handleFile = async (f: File) => {
        if (f.type !== "application/pdf") { toast.error("Please upload a PDF file."); return; }
        if (f.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB."); return; }
        setFile(f); setResumeText(""); setResult(null); setStep("extracting");
        try {
            const fd = new FormData(); fd.append("resume", f);
            const res = await fetch("/api/tools/extract", { method: "POST", body: fd });
            const data = await res.json();
            if (!data.success) { toast.error(data.error || "Failed to read PDF."); setStep("upload"); return; }
            setResumeText(data.text); setStep("ready");
            toast.success("Resume loaded!");
        } catch { toast.error("Failed to process PDF."); setStep("upload"); }
    };

    const handleSubmit = async () => {
        if (!resumeText) { toast.error("Upload your resume first."); return; }
        setStep("analyzing");
        try {
            const res = await fetch("/api/tools/ats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resumeText, jobDescription: jd }),
            });
            const data = await res.json();
            if (!data.success) { toast.error(data.error || "Analysis failed."); setStep("ready"); return; }
            setResult(data.result); setStep("done");
        } catch { toast.error("Something went wrong."); setStep("ready"); }
    };

    const scoreLabel = result
        ? result.overallScore >= 75 ? "Strong" : result.overallScore >= 60 ? "Fair" : result.overallScore >= 45 ? "Weak" : "Poor"
        : "";

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto">
            <div>
                <h2>ATS Score Checker</h2>
                <p className="text-light-400 mt-1">Strict, honest resume scoring — the same way real ATS systems evaluate candidates. Most resumes score 45–65.</p>
            </div>

            <div className="flex flex-col gap-5">
                {/* Upload */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                    onClick={() => step !== "extracting" && document.getElementById("ats-input")?.click()}
                    className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 transition-colors
                        ${step === "extracting" ? "border-primary-200/50 bg-primary-200/5 cursor-wait" : "cursor-pointer"}
                        ${step === "ready" || step === "done" || step === "analyzing" ? "border-success-100/50 bg-success-100/5" : step !== "extracting" ? "border-light-600 hover:border-primary-200/50" : ""}`}
                >
                    <input id="ats-input" type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                    {step === "extracting" ? (
                        <><span className="size-7 border-2 border-primary-200/30 border-t-primary-200 rounded-full animate-spin" /><p className="text-light-400 text-sm">Reading resume...</p></>
                    ) : (
                        <><span className="text-4xl">{step === "upload" ? "📄" : "✅"}</span>
                            <div className="text-center">
                                {file ? <><p className="font-semibold text-white">{file.name}</p><p className="text-light-400 text-sm">Click to change</p></>
                                    : <><p className="font-semibold text-white">Drop your resume here</p><p className="text-light-400 text-sm">PDF only · max 5MB</p></>}
                            </div></>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm text-light-400">
                        Job Description <span className="text-primary-200 font-medium">(strongly recommended — unlocks keyword match %)</span>
                    </label>
                    <textarea value={jd} onChange={(e) => setJd(e.target.value)}
                        placeholder="Paste the full job description here for precise keyword gap analysis..."
                        rows={5}
                        className="bg-dark-200 border border-light-600/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-light-600 focus:outline-none focus:border-primary-200/50 resize-none" />
                </div>

                <Button className="btn-primary" onClick={handleSubmit} disabled={step === "extracting" || step === "analyzing" || !resumeText}>
                    {step === "analyzing" ? <span className="flex items-center gap-2"><span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analysing...</span>
                        : step === "extracting" ? "Reading PDF..." : "Run ATS Analysis"}
                </Button>
            </div>

            {result && (
                <div className="flex flex-col gap-6">
                    {/* Score header */}
                    <div className="bg-dark-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
                        <ScoreRing score={result.overallScore} />
                        <div className="flex flex-col gap-2 flex-1 text-center sm:text-left">
                            <div className="flex items-center gap-3 justify-center sm:justify-start flex-wrap">
                                <h3 className="text-white text-xl font-bold">ATS Score: {result.overallScore}/100</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.overallScore >= 75 ? "bg-success-100/20 text-success-100" : result.overallScore >= 55 ? "bg-yellow-400/20 text-yellow-400" : "bg-destructive-100/20 text-destructive-100"}`}>
                                    {scoreLabel}
                                </span>
                            </div>
                            {result.matchRate != null && (
                                <p className="text-sm text-light-400">
                                    Keyword match rate: <span className="text-white font-semibold">{result.matchRate}%</span> against the job description
                                </p>
                            )}
                            <p className="text-sm text-light-400 leading-relaxed">{result.summary}</p>
                        </div>
                    </div>

                    {/* Score breakdown */}
                    <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-5">
                        <h3 className="text-primary-100">Weighted Score Breakdown</h3>
                        {result.scoreBreakdown && Object.entries(result.scoreBreakdown).map(([key, val]) => (
                            <WeightedBar key={key} label={key} item={val} />
                        ))}
                    </div>

                    {/* Red flags */}
                    {result.redFlags?.length > 0 && (
                        <div className="bg-destructive-100/5 border border-destructive-100/20 rounded-2xl p-6 flex flex-col gap-3">
                            <h3 className="text-destructive-100 flex items-center gap-2">🚨 Red Flags</h3>
                            <ul className="flex flex-col gap-2">
                                {result.redFlags.map((f, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-light-100">
                                        <span className="text-destructive-100 shrink-0 mt-0.5">✗</span>{f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Improvements */}
                    {result.improvements?.length > 0 && (
                        <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-4">
                            <h3 className="text-primary-100">Action Items</h3>
                            {result.improvements.map((imp, i) => (
                                <div key={i} className={`flex flex-col gap-1.5 rounded-xl p-4 border ${priorityColors[imp.priority]}`}>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${priorityBadge[imp.priority]}`}>{imp.priority}</span>
                                        <span className="text-sm font-semibold text-white">{imp.section}</span>
                                    </div>
                                    <p className="text-sm text-light-400">{imp.issue}</p>
                                    <p className="text-sm text-primary-100 font-medium">→ {imp.fix}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Keywords */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {result.foundKeywords?.length > 0 && (
                            <div className="bg-dark-200 rounded-2xl p-5 flex flex-col gap-3">
                                <h3 className="text-success-100 text-base">Keywords Found ✓</h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {result.foundKeywords.map((k, i) => <span key={i} className="px-2.5 py-1 bg-success-100/10 text-success-100 rounded-full text-xs border border-success-100/20">{k}</span>)}
                                </div>
                            </div>
                        )}
                        {result.missingKeywords?.length > 0 && (
                            <div className="bg-dark-200 rounded-2xl p-5 flex flex-col gap-3">
                                <h3 className="text-destructive-100 text-base">Keywords Missing ✗</h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {result.missingKeywords.map((k, i) => <span key={i} className="px-2.5 py-1 bg-destructive-100/10 text-destructive-100 rounded-full text-xs border border-destructive-100/20">{k}</span>)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bullet rewrites */}
                    {result.rewrittenBullets?.length > 0 && (
                        <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-4">
                            <h3 className="text-primary-100">Bullet Point Rewrites</h3>
                            {result.rewrittenBullets.map((b, i) => (
                                <div key={i} className="bg-dark-300 rounded-xl p-4 flex flex-col gap-3">
                                    <div>
                                        <p className="text-xs text-destructive-100 font-semibold mb-1 uppercase tracking-wide">Before</p>
                                        <p className="text-sm text-light-400">{b.original}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-success-100 font-semibold mb-1 uppercase tracking-wide">After</p>
                                        <p className="text-sm text-white font-medium">{b.rewritten}</p>
                                    </div>
                                    <p className="text-xs text-light-600 border-t border-light-600/20 pt-2">{b.reason}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Strengths */}
                    {result.strengths?.length > 0 && (
                        <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-3">
                            <h3 className="text-success-100">Genuine Strengths</h3>
                            <ul className="flex flex-col gap-2">
                                {result.strengths.map((s, i) => <li key={i} className="flex items-start gap-2 text-sm text-light-100"><span className="text-success-100 shrink-0 mt-0.5">✓</span>{s}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
