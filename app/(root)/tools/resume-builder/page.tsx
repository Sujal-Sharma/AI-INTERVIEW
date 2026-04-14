"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface BuilderResult {
    summary: string;
    keySkills: string[];
    tailoredBullets?: { section: string; bullets: string[] }[];
    missingKeywords?: string[];
    fullResumeText: string;
}

export default function ResumeBuilderPage() {
    const [mode, setMode] = useState<"optimize" | "generate">("optimize");
    const [file, setFile] = useState<File | null>(null);
    const [jd, setJd] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<BuilderResult | null>(null);
    const [dragging, setDragging] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleFile = (f: File) => {
        if (f.type !== "application/pdf") { toast.error("Please upload a PDF file."); return; }
        if (f.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB."); return; }
        setFile(f);
        setResult(null);
    };

    const handleSubmit = async () => {
        if (!jd.trim()) { toast.error("Please enter a job description."); return; }
        if (mode === "optimize" && !file) { toast.error("Please upload your resume to optimize."); return; }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("jobDescription", jd);
            formData.append("mode", mode);
            if (file) formData.append("resume", file);
            if (name) formData.append("name", name);
            if (email) formData.append("email", email);

            const res = await fetch("/api/tools/resume-builder", { method: "POST", body: formData });
            const data = await res.json();
            if (!data.success) { toast.error(data.error || "Failed to generate resume."); return; }
            setResult(data.result);
        } catch {
            toast.error("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!result?.fullResumeText) return;
        const blob = new Blob([result.fullResumeText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "resume.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Resume downloaded!");
    };

    const handleCopy = () => {
        if (!result?.fullResumeText) return;
        navigator.clipboard.writeText(result.fullResumeText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Copied to clipboard!");
    };

    return (
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
            <div>
                <h2>Resume Builder</h2>
                <p className="text-light-400 mt-1">Paste a job description to optimize your existing resume or generate a tailored resume from scratch.</p>
            </div>

            {/* Mode selector */}
            <div className="flex gap-3">
                <button
                    onClick={() => { setMode("optimize"); setResult(null); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors border
                        ${mode === "optimize" ? "bg-primary-200 text-dark-100 border-primary-200" : "bg-dark-200 text-light-400 border-light-600/20 hover:text-white"}`}
                >
                    Optimize Existing Resume
                </button>
                <button
                    onClick={() => { setMode("generate"); setFile(null); setResult(null); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors border
                        ${mode === "generate" ? "bg-primary-200 text-dark-100 border-primary-200" : "bg-dark-200 text-light-400 border-light-600/20 hover:text-white"}`}
                >
                    Generate New Resume
                </button>
            </div>

            <div className="flex flex-col gap-5">
                {/* Resume upload (optimize mode) */}
                {mode === "optimize" && (
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                        onClick={() => document.getElementById("builder-input")?.click()}
                        className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-colors
                            ${dragging ? "border-primary-200 bg-primary-200/5" : "border-light-600 hover:border-primary-200/50"}
                            ${file ? "border-success-100/50 bg-success-100/5" : ""}`}
                    >
                        <input id="builder-input" type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                        <span className="text-4xl">{file ? "✅" : "🛠️"}</span>
                        <div className="text-center">
                            {file ? (
                                <>
                                    <p className="font-semibold text-white">{file.name}</p>
                                    <p className="text-light-400 text-sm">Click to change</p>
                                </>
                            ) : (
                                <>
                                    <p className="font-semibold text-white">Upload your current resume</p>
                                    <p className="text-light-400 text-sm">PDF only, max 5MB</p>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Generate mode: name/email */}
                {mode === "generate" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-light-400">Your Name (optional)</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                className="bg-dark-200 border border-light-600/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-light-600 focus:outline-none focus:border-primary-200/50"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-light-400">Email (optional)</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="john@example.com"
                                className="bg-dark-200 border border-light-600/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-light-600 focus:outline-none focus:border-primary-200/50"
                            />
                        </div>
                    </div>
                )}

                {/* JD */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-light-400">Job Description <span className="text-destructive-100">*</span></label>
                    <textarea
                        value={jd}
                        onChange={(e) => setJd(e.target.value)}
                        placeholder="Paste the job description here..."
                        rows={6}
                        className="bg-dark-200 border border-light-600/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-light-600 focus:outline-none focus:border-primary-200/50 resize-none"
                    />
                </div>

                <Button className="btn-primary" onClick={handleSubmit} disabled={loading || !jd.trim() || (mode === "optimize" && !file)}>
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {mode === "optimize" ? "Optimising..." : "Generating..."}
                        </span>
                    ) : mode === "optimize" ? "Optimise Resume" : "Generate Resume"}
                </Button>
            </div>

            {result && (
                <div className="flex flex-col gap-6">
                    {/* Summary */}
                    <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-3">
                        <h3 className="text-primary-100">Professional Summary</h3>
                        <p className="text-sm text-light-100">{result.summary}</p>
                    </div>

                    {/* Key skills */}
                    {result.keySkills?.length > 0 && (
                        <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-3">
                            <h3 className="text-primary-100">Key Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {result.keySkills.map((s, i) => (
                                    <span key={i} className="px-3 py-1 bg-primary-200/10 text-primary-100 rounded-full text-sm border border-primary-200/20">{s}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tailored bullets (optimize mode) */}
                    {result.tailoredBullets && result.tailoredBullets.length > 0 && (
                        <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-4">
                            <h3 className="text-primary-100">Tailored Experience Bullets</h3>
                            {result.tailoredBullets.map((section, i) => (
                                <div key={i} className="flex flex-col gap-2">
                                    <p className="text-sm font-semibold text-white">{section.section}</p>
                                    <ul className="flex flex-col gap-1">
                                        {section.bullets.map((b, j) => (
                                            <li key={j} className="flex items-start gap-2 text-sm text-light-100">
                                                <span className="text-primary-200 mt-0.5">•</span>{b}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Missing keywords */}
                    {result.missingKeywords && result.missingKeywords.length > 0 && (
                        <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-3">
                            <h3 className="text-primary-100">Keywords Added from JD</h3>
                            <div className="flex flex-wrap gap-2">
                                {result.missingKeywords.map((kw, i) => (
                                    <span key={i} className="px-3 py-1 bg-success-100/10 text-success-100 rounded-full text-sm border border-success-100/20">{kw}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Full resume text + download */}
                    <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-primary-100">Full Resume</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCopy}
                                    className="px-3 py-1.5 bg-dark-300 text-light-400 hover:text-white rounded-lg text-xs transition-colors"
                                >
                                    {copied ? "Copied!" : "Copy"}
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="px-3 py-1.5 bg-primary-200 text-dark-100 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors"
                                >
                                    Download .txt
                                </button>
                            </div>
                        </div>
                        <pre className="text-sm text-light-100 whitespace-pre-wrap font-mono bg-dark-300 rounded-xl p-4 max-h-[400px] overflow-y-auto leading-relaxed">
                            {result.fullResumeText}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
