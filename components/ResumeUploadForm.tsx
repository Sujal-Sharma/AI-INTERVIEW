"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const ResumeUploadForm = ({ userId }: { userId: string }) => {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [type, setType] = useState("mixed");
    const [amount, setAmount] = useState(5);
    const [loading, setLoading] = useState(false);
    const [dragging, setDragging] = useState(false);

    const handleFile = (f: File) => {
        if (f.type !== "application/pdf") {
            toast.error("Please upload a PDF file.");
            return;
        }
        if (f.size > 5 * 1024 * 1024) {
            toast.error("File must be under 5MB.");
            return;
        }
        setFile(f);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) handleFile(dropped);
    };

    const handleSubmit = async () => {
        if (!file) { toast.error("Please upload your resume first."); return; }
        if (!userId) { toast.error("You must be signed in."); return; }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("resume", file);
            formData.append("userId", userId);
            formData.append("type", type);
            formData.append("amount", String(amount));

            const res = await fetch("/api/resume", { method: "POST", body: formData });
            const data = await res.json();

            if (!data.success) {
                toast.error(data.error || "Failed to generate interview.");
                return;
            }
            toast.success("Interview generated! Starting now...");
            router.push(`/interview/${data.interviewId}`);
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            {/* Drop zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-2xl p-10 transition-colors cursor-pointer
                    ${dragging ? "border-primary-200 bg-primary-200/5" : "border-light-600 hover:border-primary-200/50"}
                    ${file ? "border-success-100/50 bg-success-100/5" : ""}`}
                onClick={() => document.getElementById("resume-input")?.click()}
            >
                <input
                    id="resume-input"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                {file ? (
                    <>
                        <div className="size-14 rounded-full bg-success-100/10 flex items-center justify-center">
                            <Image src="/star.svg" alt="file" width={24} height={24} />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-white">{file.name}</p>
                            <p className="text-light-400 text-sm">{(file.size / 1024).toFixed(0)} KB — click to change</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="size-14 rounded-full bg-dark-200 flex items-center justify-center">
                            <Image src="/calendar.svg" alt="upload" width={24} height={24} />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-white">Drop your resume here</p>
                            <p className="text-light-400 text-sm">PDF only, max 5MB</p>
                        </div>
                    </>
                )}
            </div>

            {/* Options */}
            <div className="flex flex-col gap-4 bg-dark-200 rounded-2xl p-6">
                <h3 className="text-primary-100">Interview Options</h3>

                <div className="flex flex-col gap-2">
                    <label className="text-sm text-light-400">Interview Type</label>
                    <div className="flex gap-3 flex-wrap">
                        {["technical", "behavioral", "mixed"].map((t) => (
                            <button
                                key={t}
                                onClick={() => setType(t)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors
                                    ${type === t ? "bg-primary-200 text-dark-100" : "bg-dark-300 text-light-400 hover:text-white"}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm text-light-400">Number of Questions: <span className="text-white font-semibold">{amount}</span></label>
                    <input
                        type="range"
                        min={3}
                        max={15}
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full accent-primary-200"
                    />
                    <div className="flex justify-between text-xs text-light-400">
                        <span>3</span><span>15</span>
                    </div>
                </div>
            </div>

            <Button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={loading || !file}
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analysing Resume...
                    </span>
                ) : "Generate Interview from Resume"}
            </Button>
        </div>
    );
};

export default ResumeUploadForm;
