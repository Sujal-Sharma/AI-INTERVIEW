"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ContactInfo { name: string; email: string; phone?: string; linkedin?: string; github?: string; location?: string; }
interface SkillGroup { category: string; items: string[]; }
interface Experience { title: string; company: string; location?: string; duration: string; bullets: string[]; }
interface Project { name: string; link?: string; tech: string; bullets: string[]; }
interface Education { degree: string; institution: string; duration: string; gpa?: string; details?: string; }
interface BuilderResult {
    contactInfo: ContactInfo;
    summary: string;
    skills: SkillGroup[];
    experience: Experience[];
    projects: Project[];
    education: Education[];
    certifications: string[];
    atsKeywordsAdded: string[];
    changesExplanation: string;
}

type Step = "idle" | "extracting" | "ready" | "generating" | "done";

// Generates HTML matching your exact resume format for PDF print
function buildResumeHTML(result: BuilderResult): string {
    const { contactInfo: c, summary, skills, experience, projects, education, certifications } = result;

    const contactParts = [
        c.github ? `<a href="https://${c.github}" style="color:#1a0dab">${c.github.replace(/^https?:\/\//, "")}</a>` : "",
        c.linkedin ? `<a href="https://${c.linkedin}" style="color:#1a0dab">${c.linkedin.replace(/^https?:\/\//, "")}</a>` : "",
        c.email ? `<a href="mailto:${c.email}" style="color:#1a0dab">${c.email}</a>` : "",
        c.phone ? c.phone : "",
        c.location ? c.location : "",
    ].filter(Boolean).join(" &nbsp;|&nbsp; ");

    const expHTML = experience?.length
        ? experience.map(e => `
            <div style="margin-bottom:10px">
                <div style="display:flex;justify-content:space-between;align-items:baseline">
                    <strong>${e.title}${e.company ? `, ${e.company}` : ""}</strong>
                    <span style="font-size:10pt">${e.duration}</span>
                </div>
                ${e.location ? `<div style="font-size:10pt;color:#555;margin-bottom:3px">${e.location}</div>` : ""}
                <ul style="margin:4px 0 0 0;padding-left:18px">${e.bullets.map(b => `<li style="margin-bottom:2px">${b}</li>`).join("")}</ul>
            </div>`).join("") : "";

    const projectsHTML = projects?.length
        ? projects.map(p => `
            <div style="margin-bottom:10px">
                <div style="display:flex;justify-content:space-between;align-items:baseline">
                    <strong>${p.name}</strong>
                    ${p.link ? `<a href="https://${p.link}" style="color:#1a0dab;font-size:10pt">[Link]</a>` : ""}
                </div>
                <div style="font-size:10pt;color:#555;margin-bottom:3px">Tech: ${p.tech}</div>
                <ul style="margin:4px 0 0 0;padding-left:18px">${p.bullets.map(b => `<li style="margin-bottom:2px">${b}</li>`).join("")}</ul>
            </div>`).join("") : "";

    const eduHTML = education?.map(e => `
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
            <div>
                <strong>${e.degree}</strong>, ${e.institution}
                ${e.details ? `<div style="font-size:10pt;color:#555">${e.details}</div>` : ""}
            </div>
            <div style="text-align:right;font-size:10pt">
                ${e.gpa ? `CGPA: ${e.gpa}<br>` : ""}${e.duration}
            </div>
        </div>`).join("") ?? "";

    const skillsHTML = skills?.map(sg =>
        `<div style="margin-bottom:3px"><strong>${sg.category}:</strong> ${sg.items.join(", ")}</div>`
    ).join("") ?? "";

    const certHTML = certifications?.length
        ? certifications.map(cert => `<a href="#" style="color:#1a0dab;margin-right:16px">${cert}</a>`).join("") : "";

    const section = (title: string, content: string) => content.trim()
        ? `<div style="margin-bottom:14px">
            <div style="font-variant:small-caps;font-weight:bold;font-size:11.5pt;border-bottom:1px solid #000;margin-bottom:6px;padding-bottom:1px;letter-spacing:0.05em">${title}</div>
            ${content}
           </div>` : "";

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${c.name || "Resume"}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 11pt;
    line-height: 1.4;
    color: #000;
    background: #fff;
    padding: 2cm 2.2cm;
    max-width: 21cm;
    margin: auto;
  }
  h1 { font-size: 17pt; font-weight: bold; text-align: center; margin-bottom: 4px; letter-spacing: 0.08em; }
  .contact { text-align: center; font-size: 10pt; margin-bottom: 14px; }
  ul { list-style-type: disc; }
  li { margin-bottom: 1px; }
  strong { font-weight: bold; }
  a { color: #1a0dab; text-decoration: none; }
  @media print {
    body { padding: 1.5cm 2cm; }
    a { color: #000; }
  }
</style>
</head>
<body>
  <h1>${c.name || "Your Name"}</h1>
  <div class="contact">${contactParts}</div>
  ${section("Summary", summary ? `<p>${summary}</p>` : "")}
  ${section("Projects", projectsHTML)}
  ${section("Experience", expHTML)}
  ${section("Education", eduHTML)}
  ${certHTML ? section("Certifications", `<div style="font-size:10pt">${certHTML}</div>`) : ""}
  ${section("Skills", skillsHTML)}
  <script>window.onload=function(){window.print();}<\/script>
</body>
</html>`;
}

export default function ResumeBuilderPage() {
    const [mode, setMode] = useState<"optimize" | "generate">("optimize");
    const [file, setFile] = useState<File | null>(null);
    const [resumeText, setResumeText] = useState("");
    const [jd, setJd] = useState("");
    const [name, setName] = useState(""); const [email, setEmail] = useState("");
    const [phone, setPhone] = useState(""); const [linkedin, setLinkedin] = useState("");
    const [github, setGithub] = useState("");
    const [step, setStep] = useState<Step>("idle");
    const [result, setResult] = useState<BuilderResult | null>(null);
    const [dragging, setDragging] = useState(false);

    const handleFile = async (f: File) => {
        if (f.type !== "application/pdf") { toast.error("Please upload a PDF file."); return; }
        if (f.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB."); return; }
        setFile(f); setResumeText(""); setResult(null); setStep("extracting");
        try {
            const fd = new FormData(); fd.append("resume", f);
            const res = await fetch("/api/tools/extract", { method: "POST", body: fd });
            const data = await res.json();
            if (!data.success) { toast.error(data.error || "Failed to read PDF."); setStep("idle"); return; }
            setResumeText(data.text); setStep("ready"); toast.success("Resume loaded!");
        } catch { toast.error("Failed to process PDF."); setStep("idle"); }
    };

    const handleSubmit = async () => {
        if (!jd.trim()) { toast.error("Please enter a job description."); return; }
        if (mode === "optimize" && !resumeText) { toast.error("Please upload your resume."); return; }
        setStep("generating"); setResult(null);
        try {
            const res = await fetch("/api/tools/resume-builder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resumeText, jobDescription: jd, mode, name, email, phone, linkedin, github }),
            });
            const data = await res.json();
            if (!data.success) { toast.error(data.error || "Failed."); setStep(mode === "optimize" ? "ready" : "idle"); return; }
            setResult(data.result); setStep("done");
        } catch { toast.error("Something went wrong."); setStep(mode === "optimize" ? "ready" : "idle"); }
    };

    const handleDownloadPDF = () => {
        if (!result) return;
        const html = buildResumeHTML(result);
        const win = window.open("", "_blank");
        if (!win) { toast.error("Allow popups to download PDF."); return; }
        win.document.write(html);
        win.document.close();
    };

    const handleCopyText = () => {
        if (!result) return;
        const lines: string[] = [];
        const c = result.contactInfo;
        lines.push(c.name || "");
        lines.push([c.github, c.linkedin, c.email, c.phone, c.location].filter(Boolean).join(" | "));
        lines.push("");
        if (result.summary) { lines.push("SUMMARY"); lines.push(result.summary); lines.push(""); }
        if (result.projects?.length) {
            lines.push("PROJECTS");
            result.projects.forEach(p => { lines.push(`${p.name} | Tech: ${p.tech}${p.link ? ` | ${p.link}` : ""}`); p.bullets.forEach(b => lines.push(`• ${b}`)); lines.push(""); });
        }
        if (result.experience?.length) {
            lines.push("EXPERIENCE");
            result.experience.forEach(e => { lines.push(`${e.title}, ${e.company} | ${e.duration}`); e.bullets.forEach(b => lines.push(`• ${b}`)); lines.push(""); });
        }
        if (result.education?.length) {
            lines.push("EDUCATION");
            result.education.forEach(e => { lines.push(`${e.degree}, ${e.institution} | ${e.duration}${e.gpa ? ` | GPA: ${e.gpa}` : ""}`); });
            lines.push("");
        }
        if (result.certifications?.length) { lines.push("CERTIFICATIONS"); result.certifications.forEach(c => lines.push(`• ${c}`)); lines.push(""); }
        if (result.skills?.length) {
            lines.push("SKILLS");
            result.skills.forEach(sg => lines.push(`${sg.category}: ${sg.items.join(", ")}`));
        }
        navigator.clipboard.writeText(lines.join("\n"));
        toast.success("Copied to clipboard!");
    };

    const isLoading = step === "extracting" || step === "generating";

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto">
            <div>
                <h2>Resume Builder</h2>
                <p className="text-light-400 mt-1">Generate an ATS-optimized resume from any job description, or optimize your existing one. Download as a professionally formatted PDF.</p>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-3">
                <button onClick={() => { setMode("optimize"); setResult(null); setStep(resumeText ? "ready" : "idle"); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border
                        ${mode === "optimize" ? "bg-primary-200 text-dark-100 border-primary-200" : "bg-dark-200 text-light-400 border-light-600/20 hover:text-white"}`}>
                    Optimize My Resume
                </button>
                <button onClick={() => { setMode("generate"); setFile(null); setResumeText(""); setResult(null); setStep("idle"); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border
                        ${mode === "generate" ? "bg-primary-200 text-dark-100 border-primary-200" : "bg-dark-200 text-light-400 border-light-600/20 hover:text-white"}`}>
                    Generate New Resume
                </button>
            </div>

            <div className="flex flex-col gap-5">
                {/* Upload (optimize mode) */}
                {mode === "optimize" && (
                    <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                        onClick={() => step !== "extracting" && document.getElementById("builder-input")?.click()}
                        className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 transition-colors
                            ${step === "extracting" ? "border-primary-200/50 bg-primary-200/5 cursor-wait" : "cursor-pointer"}
                            ${step === "ready" || step === "done" ? "border-success-100/50 bg-success-100/5" : step !== "extracting" ? "border-light-600 hover:border-primary-200/50" : ""}`}>
                        <input id="builder-input" type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                        {step === "extracting" ? (<><span className="size-7 border-2 border-primary-200/30 border-t-primary-200 rounded-full animate-spin" /><p className="text-light-400 text-sm">Reading resume...</p></>)
                            : (<><span className="text-4xl">{resumeText ? "✅" : "🛠️"}</span>
                                <div className="text-center">{file ? (<><p className="font-semibold text-white">{file.name}</p><p className="text-light-400 text-sm">Click to change</p></>)
                                    : (<><p className="font-semibold text-white">Upload your current resume</p><p className="text-light-400 text-sm">PDF only · max 5MB</p></>)}</div></>)}
                    </div>
                )}

                {/* Contact details (generate mode) */}
                {mode === "generate" && (
                    <div className="flex flex-col gap-4 bg-dark-200 rounded-2xl p-5">
                        <p className="text-sm font-semibold text-white">Your Details <span className="text-light-600 font-normal">(optional — appear in the resume)</span></p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[["Full Name", name, setName, "John Doe"], ["Email", email, setEmail, "john@example.com"],
                              ["Phone", phone, setPhone, "+91 9999999999"], ["LinkedIn URL", linkedin, setLinkedin, "linkedin.com/in/johndoe"],
                              ["GitHub URL", github, setGithub, "github.com/johndoe"]].map(([label, val, setter, ph]) => (
                                <div key={label as string} className="flex flex-col gap-1.5">
                                    <label className="text-xs text-light-400">{label as string}</label>
                                    <input type="text" value={val as string} onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                                        placeholder={ph as string}
                                        className="bg-dark-300 border border-light-600/30 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-light-600 focus:outline-none focus:border-primary-200/50" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* JD */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-light-400">Job Description <span className="text-destructive-100">*</span></label>
                    <textarea value={jd} onChange={(e) => setJd(e.target.value)}
                        placeholder="Paste the full job description here. More detail = better keyword matching..."
                        rows={6}
                        className="bg-dark-200 border border-light-600/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-light-600 focus:outline-none focus:border-primary-200/50 resize-none" />
                </div>

                <Button className="btn-primary" onClick={handleSubmit}
                    disabled={isLoading || !jd.trim() || (mode === "optimize" && !resumeText)}>
                    {step === "generating" ? <span className="flex items-center gap-2"><span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{mode === "optimize" ? "Optimising..." : "Generating..."}</span>
                        : step === "extracting" ? "Reading PDF..." : mode === "optimize" ? "Optimise Resume" : "Generate Resume"}
                </Button>
            </div>

            {result && (
                <div className="flex flex-col gap-6">
                    {/* Actions bar */}
                    <div className="flex items-center justify-between flex-wrap gap-3 bg-dark-200 rounded-2xl p-4">
                        <div className="flex flex-col gap-0.5">
                            <p className="text-white font-semibold text-sm">Resume ready</p>
                            <p className="text-light-400 text-xs">{result.changesExplanation}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleCopyText} className="px-4 py-2 bg-dark-300 text-light-400 hover:text-white rounded-xl text-sm transition-colors">Copy Text</button>
                            <button onClick={handleDownloadPDF}
                                className="px-4 py-2 bg-primary-200 text-dark-100 rounded-xl text-sm font-semibold hover:bg-primary-100 transition-colors">
                                Download PDF ↓
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-light-600 -mt-4 px-1">PDF tip: In the print dialog, choose "Save as PDF" as destination and set margins to "Minimum".</p>

                    {/* Preview card */}
                    <div className="bg-white rounded-2xl p-8 text-black font-serif shadow-xl" style={{ fontFamily: "'Times New Roman', serif", fontSize: "10.5pt", lineHeight: "1.45" }}>
                        {/* Header */}
                        <h1 className="text-center font-bold tracking-widest mb-1" style={{ fontSize: "16pt" }}>
                            {result.contactInfo.name || "Your Name"}
                        </h1>
                        <p className="text-center text-xs mb-4" style={{ fontSize: "9pt" }}>
                            {[result.contactInfo.github, result.contactInfo.linkedin, result.contactInfo.email, result.contactInfo.phone, result.contactInfo.location].filter(Boolean).join("  |  ")}
                        </p>

                        {/* Summary */}
                        {result.summary && (
                            <div className="mb-3">
                                <p className="font-bold border-b border-black mb-1 pb-0.5" style={{ fontVariant: "small-caps", fontSize: "11pt" }}>Summary</p>
                                <p style={{ fontSize: "10pt" }}>{result.summary}</p>
                            </div>
                        )}

                        {/* Projects */}
                        {result.projects?.length > 0 && (
                            <div className="mb-3">
                                <p className="font-bold border-b border-black mb-2 pb-0.5" style={{ fontVariant: "small-caps", fontSize: "11pt" }}>Projects</p>
                                {result.projects.map((p, i) => (
                                    <div key={i} className="mb-2">
                                        <div className="flex justify-between items-baseline">
                                            <span className="font-bold" style={{ fontSize: "10.5pt" }}>{p.name}</span>
                                            {p.link && <span className="text-blue-700 text-xs">[{p.link}]</span>}
                                        </div>
                                        <p className="italic text-gray-600" style={{ fontSize: "9.5pt" }}>Tech: {p.tech}</p>
                                        <ul className="list-disc ml-4 mt-0.5">
                                            {p.bullets.map((b, j) => <li key={j} style={{ fontSize: "10pt" }}>{b}</li>)}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Experience */}
                        {result.experience?.length > 0 && (
                            <div className="mb-3">
                                <p className="font-bold border-b border-black mb-2 pb-0.5" style={{ fontVariant: "small-caps", fontSize: "11pt" }}>Experience</p>
                                {result.experience.map((e, i) => (
                                    <div key={i} className="mb-2">
                                        <div className="flex justify-between items-baseline">
                                            <span className="font-bold" style={{ fontSize: "10.5pt" }}>{e.title}{e.company ? `, ${e.company}` : ""}</span>
                                            <span style={{ fontSize: "9.5pt" }}>{e.duration}</span>
                                        </div>
                                        {e.location && <p className="text-gray-500 italic" style={{ fontSize: "9.5pt" }}>{e.location}</p>}
                                        <ul className="list-disc ml-4 mt-0.5">
                                            {e.bullets.map((b, j) => <li key={j} style={{ fontSize: "10pt" }}>{b}</li>)}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Education */}
                        {result.education?.length > 0 && (
                            <div className="mb-3">
                                <p className="font-bold border-b border-black mb-2 pb-0.5" style={{ fontVariant: "small-caps", fontSize: "11pt" }}>Education</p>
                                {result.education.map((e, i) => (
                                    <div key={i} className="flex justify-between items-baseline mb-1">
                                        <div>
                                            <span className="font-bold" style={{ fontSize: "10.5pt" }}>{e.degree}</span>
                                            <span>, {e.institution}</span>
                                            {e.details && <p className="text-gray-500 text-xs italic">{e.details}</p>}
                                        </div>
                                        <div className="text-right" style={{ fontSize: "9.5pt" }}>
                                            {e.gpa && <div>CGPA: {e.gpa}</div>}
                                            <div>{e.duration}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Certifications */}
                        {result.certifications?.length > 0 && (
                            <div className="mb-3">
                                <p className="font-bold border-b border-black mb-2 pb-0.5" style={{ fontVariant: "small-caps", fontSize: "11pt" }}>Certifications</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1" style={{ fontSize: "9.5pt" }}>
                                    {result.certifications.map((cert, i) => <span key={i} className="text-blue-700">{cert}</span>)}
                                </div>
                            </div>
                        )}

                        {/* Skills */}
                        {result.skills?.length > 0 && (
                            <div className="mb-2">
                                <p className="font-bold border-b border-black mb-2 pb-0.5" style={{ fontVariant: "small-caps", fontSize: "11pt" }}>Skills</p>
                                {result.skills.map((sg, i) => (
                                    <p key={i} style={{ fontSize: "10pt" }} className="mb-0.5">
                                        <span className="font-bold">{sg.category}:</span> {sg.items.join(", ")}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ATS keywords added */}
                    {result.atsKeywordsAdded?.length > 0 && (
                        <div className="bg-dark-200 rounded-2xl p-5 flex flex-col gap-3">
                            <h3 className="text-success-100 text-sm font-semibold">ATS Keywords Incorporated</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {result.atsKeywordsAdded.map((k, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-success-100/10 text-success-100 rounded-full text-xs border border-success-100/20">{k}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
