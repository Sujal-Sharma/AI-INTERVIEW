"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface SectionAnalysis {
    section: string;
    score: number;
    currentState: string;
    problems: string[];
    fixes: string[];
}
interface BulletRewrite {
    original: string;
    improved: string;
    improvement: string;
}
interface PowerVerb {
    weak: string;
    strong: string[];
}
interface ImproveResult {
    overallRating: number;
    hirabilityVerdict: string;
    summary: string;
    sectionAnalysis: SectionAnalysis[];
    bulletRewrites: BulletRewrite[];
    missingElements: string[];
    skillGaps: string[];
    keywordsToAdd: string[];
    formattingIssues: string[];
    topStrengths: string[];
    quickWins: string[];
    powerVerbAlternatives: PowerVerb[];
}

type Step = "upload" | "extracting" | "ready" | "analyzing" | "done";

const sectionColor = (score: number) =>
    score >= 7 ? "text-success-100" : score >= 5 ? "text-yellow-400" : "text-destructive-100";
const sectionBg = (score: number) =>
    score >= 7 ? "border-success-100/20 bg-success-100/5" : score >= 5 ? "border-yellow-400/20 bg-yellow-400/5" : "border-destructive-100/20 bg-destructive-100/5";

export default function ImproveResumePage() {
    const [file, setFile] = useState<File | null>(null);
    const [resumeText, setResumeText] = useState("");
    const [targetRole, setTargetRole] = useState("");
    const [step, setStep] = useState<Step>("upload");
    const [result, setResult] = useState<ImproveResult | null>(null);
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
            setResumeText(data.text); setStep("ready"); toast.success("Resume loaded!");
        } catch { toast.error("Failed to process PDF."); setStep("upload"); }
    };

    const handleSubmit = async () => {
        if (!resumeText) { toast.error("Upload your resume first."); return; }
        setStep("analyzing");
        try {
            const res = await fetch("/api/tools/improve-resume", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resumeText, targetRole }),
            });
            const data = await res.json();
            if (!data.success) { toast.error(data.error || "Analysis failed."); setStep("ready"); return; }
            setResult(data.result); setStep("done");
        } catch { toast.error("Something went wrong."); setStep("ready"); }
    };

    const ratingColor = result
        ? result.overallRating >= 8 ? "#49de50" : result.overallRating >= 6 ? "#facc15" : "#f75353"
        : "#fff";

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto">
            <div>
                <h2>Resume Improver</h2>
                <p className="text-light-400 mt-1">Senior recruiter-level review. Every suggestion references your actual resume content — no generic advice.</p>
            </div>

            <div className="flex flex-col gap-5">
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                    onClick={() => step !== "extracting" && document.getElementById("improve-input")?.click()}
                    className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 transition-colors
                        ${step === "extracting" ? "border-primary-200/50 bg-primary-200/5 cursor-wait" : "cursor-pointer"}
                        ${step === "ready" || step === "done" || step === "analyzing" ? "border-success-100/50 bg-success-100/5" : step !== "extracting" ? "border-light-600 hover:border-primary-200/50" : ""}`}
                >
                    <input id="improve-input" type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                    {step === "extracting" ? (
                        <><span className="size-7 border-2 border-primary-200/30 border-t-primary-200 rounded-full animate-spin" /><p className="text-light-400 text-sm">Reading resume...</p></>
                    ) : (
                        <><span className="text-4xl">{step === "upload" ? "✨" : "✅"}</span>
                            <div className="text-center">
                                {file ? <><p className="font-semibold text-white">{file.name}</p><p className="text-light-400 text-sm">Click to change</p></>
                                    : <><p className="font-semibold text-white">Drop your resume here</p><p className="text-light-400 text-sm">PDF only · max 5MB</p></>}
                            </div></>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm text-light-400">Target Role <span className="text-light-600">(optional but recommended)</span></label>
                    <input type="text" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
                        placeholder="e.g. Senior Software Engineer, ML Engineer, Data Scientist..."
                        className="bg-dark-200 border border-light-600/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-light-600 focus:outline-none focus:border-primary-200/50" />
                </div>

                <Button className="btn-primary" onClick={handleSubmit} disabled={step === "extracting" || step === "analyzing" || !resumeText}>
                    {step === "analyzing" ? <span className="flex items-center gap-2"><span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analysing...</span>
                        : step === "extracting" ? "Reading PDF..." : "Analyse Resume"}
                </Button>
            </div>

            {result && (
                <div className="flex flex-col gap-6">
                    {/* Header verdict */}
                    <div className="bg-dark-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
                        <div className="flex flex-col items-center gap-1 shrink-0">
                            <p className="text-light-400 text-xs uppercase tracking-wider">Rating</p>
                            <p className="text-6xl font-black" style={{ color: ratingColor }}>{result.overallRating}</p>
                            <p className="text-light-400 text-xs">/10</p>
                        </div>
                        <div className="flex flex-col gap-2 text-center sm:text-left">
                            <p className="text-white font-semibold">{result.hirabilityVerdict}</p>
                            <p className="text-sm text-light-400 leading-relaxed">{result.summary}</p>
                        </div>
                    </div>

                    {/* Quick wins */}
                    {result.quickWins?.length > 0 && (
                        <div className="bg-primary-200/5 border border-primary-200/20 rounded-2xl p-5 flex flex-col gap-3">
                            <h3 className="text-primary-100 text-base">⚡ Quick Wins — Do These First</h3>
                            <ul className="flex flex-col gap-2">
                                {result.quickWins.map((w, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-light-100">
                                        <span className="text-primary-200 font-bold shrink-0">{i + 1}.</span>{w}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Section analysis */}
                    {result.sectionAnalysis?.length > 0 && (
                        <div className="flex flex-col gap-4">
                            <h3 className="text-primary-100">Section-by-Section Analysis</h3>
                            {result.sectionAnalysis.map((sec, i) => (
                                <div key={i} className={`rounded-2xl p-5 border flex flex-col gap-3 ${sectionBg(sec.score)}`}>
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-white font-semibold">{sec.section}</h4>
                                        <span className={`text-lg font-black ${sectionColor(sec.score)}`}>{sec.score}/10</span>
                                    </div>
                                    <p className="text-sm text-light-400">{sec.currentState}</p>
                                    {sec.problems?.length > 0 && (
                                        <div>
                                            <p className="text-xs text-destructive-100 font-semibold uppercase tracking-wide mb-1.5">Problems</p>
                                            <ul className="flex flex-col gap-1">
                                                {sec.problems.map((p, j) => <li key={j} className="flex items-start gap-2 text-xs text-light-400"><span className="text-destructive-100 shrink-0">✗</span>{p}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {sec.fixes?.length > 0 && (
                                        <div>
                                            <p className="text-xs text-success-100 font-semibold uppercase tracking-wide mb-1.5">Fixes</p>
                                            <ul className="flex flex-col gap-1">
                                                {sec.fixes.map((f, j) => <li key={j} className="flex items-start gap-2 text-xs text-light-100"><span className="text-success-100 shrink-0">→</span>{f}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Bullet rewrites */}
                    {result.bulletRewrites?.length > 0 && (
                        <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-4">
                            <h3 className="text-primary-100">Bullet Point Rewrites</h3>
                            {result.bulletRewrites.map((b, i) => (
                                <div key={i} className="bg-dark-300 rounded-xl p-4 flex flex-col gap-3">
                                    <div><p className="text-xs text-destructive-100 font-semibold uppercase tracking-wide mb-1">Original</p><p className="text-sm text-light-400 leading-relaxed">{b.original}</p></div>
                                    <div><p className="text-xs text-success-100 font-semibold uppercase tracking-wide mb-1">Improved</p><p className="text-sm text-white font-medium leading-relaxed">{b.improved}</p></div>
                                    <p className="text-xs text-light-600 border-t border-light-600/20 pt-2">{b.improvement}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Missing + gaps */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {result.missingElements?.length > 0 && (
                            <div className="bg-dark-200 rounded-2xl p-5 flex flex-col gap-3">
                                <h3 className="text-destructive-100 text-base">Missing Elements</h3>
                                <ul className="flex flex-col gap-1.5">
                                    {result.missingElements.map((m, i) => <li key={i} className="flex items-start gap-2 text-sm text-light-100"><span className="text-destructive-100 shrink-0">✗</span>{m}</li>)}
                                </ul>
                            </div>
                        )}
                        {result.skillGaps?.length > 0 && (
                            <div className="bg-dark-200 rounded-2xl p-5 flex flex-col gap-3">
                                <h3 className="text-yellow-400 text-base">Skill Gaps</h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {result.skillGaps.map((s, i) => <span key={i} className="px-2.5 py-1 bg-yellow-400/10 text-yellow-400 rounded-full text-xs border border-yellow-400/20">{s}</span>)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Keywords to add */}
                    {result.keywordsToAdd?.length > 0 && (
                        <div className="bg-dark-200 rounded-2xl p-5 flex flex-col gap-3">
                            <h3 className="text-primary-100 text-base">Keywords to Add</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {result.keywordsToAdd.map((k, i) => <span key={i} className="px-2.5 py-1 bg-primary-200/10 text-primary-100 rounded-full text-xs border border-primary-200/20">{k}</span>)}
                            </div>
                        </div>
                    )}

                    {/* Power verbs */}
                    {result.powerVerbAlternatives?.length > 0 && (
                        <div className="bg-dark-200 rounded-2xl p-5 flex flex-col gap-3">
                            <h3 className="text-primary-100 text-base">Stronger Verbs</h3>
                            <div className="flex flex-col gap-2">
                                {result.powerVerbAlternatives.map((v, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm">
                                        <span className="text-light-400 line-through">{v.weak}</span>
                                        <span className="text-light-600">→</span>
                                        <div className="flex gap-1.5">{v.strong?.map((s, j) => <span key={j} className="px-2 py-0.5 bg-success-100/10 text-success-100 rounded text-xs">{s}</span>)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Strengths */}
                    {result.topStrengths?.length > 0 && (
                        <div className="bg-dark-200 rounded-2xl p-5 flex flex-col gap-3">
                            <h3 className="text-success-100 text-base">Genuine Strengths</h3>
                            <ul className="flex flex-col gap-2">
                                {result.topStrengths.map((s, i) => <li key={i} className="flex items-start gap-2 text-sm text-light-100"><span className="text-success-100 shrink-0">✓</span>{s}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
