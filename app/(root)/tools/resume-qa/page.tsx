"use client";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function ResumeQAPage() {
    const [file, setFile] = useState<File | null>(null);
    const [resumeContext, setResumeContext] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragging, setDragging] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleFile = async (f: File) => {
        if (f.type !== "application/pdf") { toast.error("Please upload a PDF file."); return; }
        if (f.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB."); return; }
        setFile(f);
        setResumeContext("");
        setMessages([]);

        // Pre-upload the resume to extract text
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("resume", f);
            formData.append("question", "Summarize this resume briefly.");
            const res = await fetch("/api/tools/resume-qa", { method: "POST", body: formData });
            const data = await res.json();
            if (data.success) {
                setResumeContext(data.resumeContext);
                setMessages([{ role: "assistant", content: "Resume uploaded successfully! Ask me anything about your background, skills, or experience." }]);
            } else {
                toast.error(data.error || "Failed to process resume.");
                setFile(null);
            }
        } catch {
            toast.error("Failed to process resume.");
            setFile(null);
        } finally {
            setUploading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        if (!resumeContext) { toast.error("Please upload your resume first."); return; }

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("question", userMessage);
            formData.append("resumeContext", resumeContext);

            const res = await fetch("/api/tools/resume-qa", { method: "POST", body: formData });
            const data = await res.json();
            if (!data.success) { toast.error(data.error || "Failed to get answer."); return; }
            setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
        } catch {
            toast.error("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const suggested = [
        "What are my strongest technical skills?",
        "What kind of roles am I best suited for?",
        "How can I describe my experience in an interview?",
        "What projects should I highlight?",
    ];

    return (
        <div className="flex flex-col gap-6 max-w-3xl mx-auto">
            <div>
                <h2>Resume Q&A</h2>
                <p className="text-light-400 mt-1">Upload your resume and ask anything — get AI answers based on your actual experience and skills.</p>
            </div>

            {!file && (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                    onClick={() => document.getElementById("qa-input")?.click()}
                    className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-colors
                        ${dragging ? "border-primary-200 bg-primary-200/5" : "border-light-600 hover:border-primary-200/50"}`}
                >
                    <input id="qa-input" type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                    <span className="text-5xl">💬</span>
                    <div className="text-center">
                        <p className="font-semibold text-white">Upload your resume to start chatting</p>
                        <p className="text-light-400 text-sm">PDF only, max 5MB</p>
                    </div>
                </div>
            )}

            {uploading && (
                <div className="flex items-center justify-center gap-3 bg-dark-200 rounded-2xl p-8">
                    <span className="size-5 border-2 border-primary-200/30 border-t-primary-200 rounded-full animate-spin" />
                    <p className="text-light-400">Processing your resume...</p>
                </div>
            )}

            {file && resumeContext && (
                <>
                    {/* File indicator */}
                    <div className="flex items-center gap-3 bg-dark-200 rounded-xl px-4 py-3">
                        <span className="text-success-100">✓</span>
                        <p className="text-sm text-white flex-1">{file.name}</p>
                        <button
                            onClick={() => { setFile(null); setResumeContext(""); setMessages([]); }}
                            className="text-xs text-light-400 hover:text-white transition-colors"
                        >
                            Change
                        </button>
                    </div>

                    {/* Chat messages */}
                    <div className="flex flex-col gap-3 bg-dark-200 rounded-2xl p-4 min-h-[300px] max-h-[450px] overflow-y-auto">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm
                                    ${msg.role === "user"
                                        ? "bg-primary-200 text-dark-100"
                                        : "bg-dark-300 text-light-100"
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-dark-300 rounded-2xl px-4 py-3">
                                    <span className="flex gap-1">
                                        <span className="size-1.5 bg-light-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="size-1.5 bg-light-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="size-1.5 bg-light-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestions */}
                    {messages.length <= 1 && (
                        <div className="flex flex-wrap gap-2">
                            {suggested.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setInput(s); }}
                                    className="px-3 py-1.5 bg-dark-200 text-light-400 rounded-full text-xs hover:text-white hover:bg-dark-300 transition-colors border border-light-600/20"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Ask anything about your resume..."
                            className="flex-1 bg-dark-200 border border-light-600/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-light-600 focus:outline-none focus:border-primary-200/50"
                            disabled={loading}
                        />
                        <Button className="btn-primary px-5" onClick={handleSend} disabled={loading || !input.trim()}>
                            Send
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
