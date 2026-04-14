"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Improvement {
    section: string;
    issue: string;
    suggestion: string;
    priority: "high" | "medium" | "low";
}

interface BulletSuggestion {
    original: string;
    improved: string;
}

interface ImproveResult {
    overallRating: number;
    summary: string;
    improvements: Improvement[];
    bulletPointSuggestions: BulletSuggestion[];
    skillsToAdd: string[];
    formattingTips: string[];
    powerWords: string[];
}

const priorityColor = { high: "text-destructive-100", medium: "text-yellow-400", low: "text-success-100" };

export default function ImproveResumePage() {
    const [file, setFile] = useState<File | null>(null);
    const [targetRole, setTargetRole] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImproveResult | null>(null);
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
            if (targetRole) formData.append("targetRole", targetRole);

            const res = await fetch("/api/tools/improve-resume", { method: "POST", body: formData });
            const data = await res.json();
            if (!data.success) { toast.error(data.error || "Analysis failed."); return; }
            setResult(data.result);
        } catch {
            toast.error("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const ratingColor = result
        ? result.overallRating >= 8 ? "text-success-100" : result.overallRating >= 6 ? "text-yellow-400" : "text-destructive-100"
        : "";

    return (
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
            <div>
                <h2>Resume Improver</h2>
                <p className="text-light-400 mt-1">Get AI-powered feedback to make your resume stand out. Optionally specify your target role for tailored advice.</p>
            </div>

            <div className="flex flex-col gap-6">
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                    onClick={() => document.getElementById("improve-input")?.click()}
                    className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-colors
                        ${dragging ? "border-primary-200 bg-primary-200/5" : "border-light-600 hover:border-primary-200/50"}
                        ${file ? "border-success-100/50 bg-success-100/5" : ""}`}
                >
                    <input id="improve-input" type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                    <span className="text-4xl">{file ? "✅" : "✨"}</span>
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

                <div className="flex flex-col gap-2">
                    <label className="text-sm text-light-400">Target Role (optional)</label>
                    <input
                        type="text"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        placeholder="e.g. Senior Frontend Engineer, Data Scientist..."
                        className="bg-dark-200 border border-light-600/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-light-600 focus:outline-none focus:border-primary-200/50"
                    />
                </div>

                <Button className="btn-primary" onClick={handleSubmit} disabled={loading || !file}>
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Analysing Resume...
                        </span>
                    ) : "Improve My Resume"}
                </Button>
            </div>

            {result && (
                <div className="flex flex-col gap-6">
                    {/* Overall rating */}
                    <div className="bg-dark-200 rounded-2xl p-6 flex flex-col items-center gap-2">
                        <p className="text-light-400 text-sm">Resume Rating</p>
                        <p className={`text-7xl font-bold ${ratingColor}`}>{result.overallRating}<span className="text-3xl text-light-400">/10</span></p>
                        <p className="text-center text-sm text-light-400 mt-2 max-w-md">{result.summary}</p>
                    </div>

                    {/* Improvements */}
                    <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-4">
                        <h3 className="text-primary-100">Improvements Needed</h3>
                        {result.improvements?.map((imp, i) => (
                            <div key={i} className="flex flex-col gap-1 bg-dark-300 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-white">{imp.section}</p>
                                    <span className={`text-xs font-medium ${priorityColor[imp.priority]} capitalize`}>{imp.priority} priority</span>
                                </div>
                                <p className="text-sm text-light-400">{imp.issue}</p>
                                <p className="text-sm text-primary-100 mt-1">→ {imp.suggestion}</p>
                            </div>
                        ))}
                    </div>

                    {/* Bullet point improvements */}
                    {result.bulletPointSuggestions?.length > 0 && (
                        <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-4">
                            <h3 className="text-primary-100">Bullet Point Rewrites</h3>
                            {result.bulletPointSuggestions.map((bp, i) => (
                                <div key={i} className="flex flex-col gap-2 bg-dark-300 rounded-xl p-4">
                                    <div>
                                        <p className="text-xs text-destructive-100 mb-1">Original</p>
                                        <p className="text-sm text-light-400 line-through">{bp.original}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-success-100 mb-1">Improved</p>
                                        <p className="text-sm text-white">{bp.improved}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Skills + Power Words */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {result.skillsToAdd?.length > 0 && (
                            <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-3">
                                <h3 className="text-primary-100">Skills to Add</h3>
                                <div className="flex flex-wrap gap-2">
                                    {result.skillsToAdd.map((s, i) => (
                                        <span key={i} className="px-3 py-1 bg-primary-200/10 text-primary-100 rounded-full text-sm border border-primary-200/20">{s}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {result.powerWords?.length > 0 && (
                            <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-3">
                                <h3 className="text-primary-100">Power Words to Use</h3>
                                <div className="flex flex-wrap gap-2">
                                    {result.powerWords.map((w, i) => (
                                        <span key={i} className="px-3 py-1 bg-success-100/10 text-success-100 rounded-full text-sm border border-success-100/20">{w}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Formatting tips */}
                    {result.formattingTips?.length > 0 && (
                        <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-3">
                            <h3 className="text-primary-100">Formatting Tips</h3>
                            <ul className="flex flex-col gap-2">
                                {result.formattingTips.map((t, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-light-100">
                                        <span className="text-primary-200 mt-0.5">→</span>{t}
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
