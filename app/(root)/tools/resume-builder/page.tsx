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

type Step = "idle" | "extracting" | "ready" | "generating" | "done";

export default function ResumeBuilderPage() {
    const [mode, setMode] = useState<"optimize" | "generate">("optimize");
    const [file, setFile] = useState<File | null>(null);
    const [resumeText, setResumeText] = useState("");
    const [jd, setJd] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [step, setStep] = useState<Step>("idle");
    const [result, setResult] = useState<BuilderResult | null>(null);
    const [dragging, setDragging] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleFile = async (f: File) => {
        if (f.type !== "application/pdf") { toast.error("Please upload a PDF file."); return; }
        if (f.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB."); return; }
        setFile(f);
        setResumeText("");
        setResult(null);
        setStep("extracting");

        try {
            const formData = new FormData();
            formData.append("resume", f);
            const res = await fetch("/api/tools/extract", { method: "POST", body: formData });
            const data = await res.json();
            if (!data.success) { toast.error(data.error || "Failed to read PDF."); setStep("idle"); return; }
            setResumeText(data.text);
            setStep("ready");
            toast.success("Resume loaded!");
        } catch {
            toast.error("Failed to process PDF.");
            setStep("idle");
        }
    };

    const handleSubmit = async () => {
        if (!jd.trim()) { toast.error("Please enter a job description."); return; }
        if (mode === "optimize" && !resumeText) { toast.error("Please upload your resume to optimize."); return; }

        setStep("generating");
        setResult(null);
        try {
            const res = await fetch("/api/tools/resume-builder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resumeText, jobDescription: jd, mode, name, email }),
            });
            const data = await res.json();
            if (!data.success) { toast.error(data.error || "Failed to generate resume."); setStep(mode === "optimize" ? "ready" : "idle"); return; }
            setResult(data.result);
            setStep("done");
        } catch {
            toast.error("Something went wrong.");
            setStep(mode === "optimize" ? "ready" : "idle");
        }
    };

    const handleDownloadTxt = () => {
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
        toast.success("Saved as resume.txt");
    };

    const handleDownloadPdf = () => {
        if (!result?.fullResumeText) return;
        // Open print dialog with resume content — browser will save as PDF
        const win = window.open("", "_blank");
        if (!win) { toast.error("Allow popups to download PDF."); return; }
        const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Resume</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; margin: 2cm; color: #000; }
  pre { white-space: pre-wrap; word-wrap: break-word; font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; }
</style>
</head>
<body>
<pre>${result.fullResumeText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
<script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;
        win.document.write(html);
        win.document.close();
    };

    const handleCopy = () => {
        if (!result?.fullResumeText) return;
        navigator.clipboard.writeText(result.fullResumeText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Copied to clipboard!");
    };

    const isLoading = step === "extracting" || step === "generating";

    return (
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
            <div>
                <h2>Resume Builder</h2>
                <p className="text-light-400 mt-1">Paste a job description to get a full ATS-optimized resume — tailored to that specific role.</p>
            </div>

            {/* Mode */}
            <div className="flex gap-3">
                <button
                    onClick={() => { setMode("optimize"); setResult(null); setStep(resumeText ? "ready" : "idle"); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors border
                        ${mode === "optimize" ? "bg-primary-200 text-dark-100 border-primary-200" : "bg-dark-200 text-light-400 border-light-600/20 hover:text-white"}`}
                >
                    Optimize Existing Resume
                </button>
                <button
                    onClick={() => { setMode("generate"); setFile(null); setResumeText(""); setResult(null); setStep("idle"); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors border
                        ${mode === "generate" ? "bg-primary-200 text-dark-100 border-primary-200" : "bg-dark-200 text-light-400 border-light-600/20 hover:text-white"}`}
                >
                    Generate New Resume
                </button>
            </div>

            <div className="flex flex-col gap-5">
                {/* Resume upload (optimize only) */}
                {mode === "optimize" && (
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                        onClick={() => step !== "extracting" && document.getElementById("builder-input")?.click()}
                        className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 transition-colors
                            ${step === "extracting" ? "border-primary-200/50 bg-primary-200/5 cursor-wait" : "cursor-pointer"}
                            ${step === "ready" || step === "done" ? "border-success-100/50 bg-success-100/5" : step !== "extracting" ? "border-light-600 hover:border-primary-200/50" : ""}`}
                    >
                        <input id="builder-input" type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                        {step === "extracting" ? (
                            <>
                                <span className="size-8 border-2 border-primary-200/30 border-t-primary-200 rounded-full animate-spin" />
                                <p className="text-light-400 text-sm">Reading your resume...</p>
                            </>
                        ) : (
                            <>
                                <span className="text-4xl">{resumeText ? "✅" : "🛠️"}</span>
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
                            </>
                        )}
                    </div>
                )}

                {/* Generate mode details */}
                {mode === "generate" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-light-400">Your Name <span className="text-light-600">(optional)</span></label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe"
                                className="bg-dark-200 border border-light-600/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-light-600 focus:outline-none focus:border-primary-200/50" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-light-400">Email <span className="text-light-600">(optional)</span></label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com"
                                className="bg-dark-200 border border-light-600/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-light-600 focus:outline-none focus:border-primary-200/50" />
                        </div>
                    </div>
                )}

                {/* JD */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-light-400">Job Description <span className="text-destructive-100">*</span></label>
                    <textarea value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the full job description here..." rows={6}
                        className="bg-dark-200 border border-light-600/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-light-600 focus:outline-none focus:border-primary-200/50 resize-none" />
                </div>

                <Button className="btn-primary" onClick={handleSubmit}
                    disabled={isLoading || !jd.trim() || (mode === "optimize" && !resumeText)}>
                    {step === "generating" ? (
                        <span className="flex items-center gap-2">
                            <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {mode === "optimize" ? "Optimising..." : "Generating Full Resume..."}
                        </span>
                    ) : step === "extracting" ? "Reading PDF..." : mode === "optimize" ? "Optimise Resume" : "Generate Resume"}
                </Button>
            </div>

            {result && (
                <div className="flex flex-col gap-6">
                    {/* Summary */}
                    <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-3">
                        <h3 className="text-primary-100">Professional Summary</h3>
                        <p className="text-sm text-light-100 leading-relaxed">{result.summary}</p>
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

                    {/* Tailored bullets */}
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

                    {/* Full resume + download */}
                    <div className="bg-dark-200 rounded-2xl p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <h3 className="text-primary-100">Full Resume</h3>
                            <div className="flex gap-2">
                                <button onClick={handleCopy}
                                    className="px-3 py-1.5 bg-dark-300 text-light-400 hover:text-white rounded-lg text-xs transition-colors">
                                    {copied ? "Copied!" : "Copy Text"}
                                </button>
                                <button onClick={handleDownloadTxt}
                                    className="px-3 py-1.5 bg-dark-300 text-light-400 hover:text-white rounded-lg text-xs transition-colors">
                                    Download .txt
                                </button>
                                <button onClick={handleDownloadPdf}
                                    className="px-3 py-1.5 bg-primary-200 text-dark-100 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors">
                                    Save as PDF
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-light-600">For PDF: click &quot;Save as PDF&quot;, then in the print dialog choose &quot;Save as PDF&quot; as destination.</p>
                        <pre className="text-sm text-light-100 whitespace-pre-wrap font-mono bg-dark-300 rounded-xl p-4 max-h-[500px] overflow-y-auto leading-relaxed">
                            {result.fullResumeText}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
