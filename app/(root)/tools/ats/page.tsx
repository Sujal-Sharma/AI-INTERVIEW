"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ATSResult {
    overallScore: number;
    sections: {
        keywords: number;
        formatting: number;
        experience: number;
        skills: number;
        education: number;
    };
    strengths: string[];
    weaknesses: string[];
    missingKeywords: string[];
    recommendations: string[];
    summary: string;
}

const ScoreBar = ({ label, score }: { label: string; score: number }) => {
    const color = score >= 75 ? "bg-success-100" : score >= 50 ? "bg-yellow-400" : "bg-destructive-100";
    return (
        <div className="flex flex-col gap-1">
            <div className="flex justify-between text-sm">
                <span className="text-light-400">{label}</span>
                <span className="text-white font-medium">{score}/100</span>
            </div>
            <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
            </div>
        </div>
    );
};

export default function ATSPage() {
    const [file, setFile] = useState<File | null>(null);
    const [jd, setJd] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ATSResult | null>(null);
    const [dragging, setDragging] = useState(false);

    const handleFile = (f: File) => {
        if (f.type !== "application/pdf") { toast.error("Please upload a PDF file."); return; }
        if (f.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB."); return; }
        setFile(f);
        setResult(null);
    };

    const handleSubmit = async () => {
        if (!file) { toast.error("Please upload your resume."); return; }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("resume", file);
            if (jd) formData.append("jobDescription", jd);

            const res = await fetch("/api/tools/ats", { method: "POST", body: formData });
            const data = await res.json();
            if (!data.success) { toast.error(data.error || "Analysis failed."); return; }
            setResult(data.result);
        } catch {
            toast.error("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const scoreColor = result
        ? result.overallScore >= 75 ? "text-success-100" : result.overallScore >= 50 ? "text-yellow-400" : "text-destructive-100"
        : "";

    return (
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
            <div>
                <h2>ATS Score Checker</h2>
                <p className="text-light-400 mt-1">See how well your resume passes Applicant Tracking Systems. Optionally paste a job description for a targeted score.</p>
            </div>

            <div className="flex flex-col gap-6">
                {/* Upload */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                    onClick={() => document.getElementById("ats-input")?.click()}
                    className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-colors
                        ${dragging ? "border-primary-200 bg-primary-200/5" : "border-light-600 hover:border-primary-200/50"}
                        ${file ? "border-success-100/50 bg-success-100/5" : ""}`}
                >
                    <input id="ats-input" type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                    <span className="text-4xl">{file ? "✅" : "📄"}</span>
                    <div className="text-center">
                        {file ? (
                            <>
                                <p className="font-semibold text-white">{file.name}</p>
                                <p className="text-light-400 text-sm">Click to change</p>
                            </>
                        ) : (
                            <>
                                <p className="font-semibold text-white">Drop your resume here</p>
                                <p className="text-light-400 text-sm">PDF only, max 5MB</p>
                            </>
                        )}
                    </div>
                </div>

                {/* JD optional */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-light-400">Job Description (optional — for targeted scoring)</label>
                    <textarea
                        value={jd}
                        onChange={(e) => setJd(e.target.value)}
                        placeholder="Paste the job description here..."
                        rows={4}
                        className="bg-dark-200 border border-light-600/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-light-600 focus:outline-none focus:border-primary-200/50 resize-none"
                    />
                </div>

                <Button className="btn-primary" onClick={handleSubmit} disabled={loading || !file}>
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Analysing...
                        </span>
                    ) : "Check ATS Score"}
                </Button>
            </div>

            {result && (
                <div className="flex flex-col gap-6">
                    {/* Overall score */}
                    <div className="bg-dark-200 rounded-2xl p-6 flex flex-col items-center gap-2">
                        <p className="text-light-400 text-sm">Overall ATS Score</p>
                        <p className={`text-7xl font-bold ${scoreColor}`}>{result.overallScore}</p>
                        <p className="text-light-400 text-sm">/100</p>
                        <p className="text-center text-sm text-light-400 mt-2 max-w-md">{result.summary}</p>
                    </div>

                    {/* Section scores */}
                    <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-4">
                        <h3 className="text-primary-100">Section Breakdown</h3>
                        {Object.entries(result.sections).map(([key, val]) => (
                            <ScoreBar key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} score={val} />
                        ))}
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-3">
                            <h3 className="text-success-100">Strengths</h3>
                            <ul className="flex flex-col gap-2">
                                {result.strengths.map((s, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-light-100">
                                        <span className="text-success-100 mt-0.5">✓</span>{s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-3">
                            <h3 className="text-destructive-100">Weaknesses</h3>
                            <ul className="flex flex-col gap-2">
                                {result.weaknesses.map((w, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-light-100">
                                        <span className="text-destructive-100 mt-0.5">✗</span>{w}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Missing keywords */}
                    {result.missingKeywords?.length > 0 && (
                        <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-3">
                            <h3 className="text-primary-100">Missing Keywords</h3>
                            <div className="flex flex-wrap gap-2">
                                {result.missingKeywords.map((kw, i) => (
                                    <span key={i} className="px-3 py-1 bg-dark-300 text-light-400 rounded-full text-sm border border-light-600/20">
                                        {kw}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recommendations */}
                    <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-3">
                        <h3 className="text-primary-100">Recommendations</h3>
                        <ol className="flex flex-col gap-2">
                            {result.recommendations.map((r, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-light-100">
                                    <span className="bg-primary-200 text-dark-100 rounded-full size-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                                    {r}
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            )}
        </div>
    );
}
