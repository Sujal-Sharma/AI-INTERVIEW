"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const LEVELS = ["All", "Junior", "Mid", "Senior"];
const TYPES = ["All", "Technical", "Behavioral", "Mixed"];

const InterviewFilters = ({ basePath = "/" }: { basePath?: string }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const level = searchParams.get("level") ?? "All";
    const type = searchParams.get("type") ?? "All";

    const update = useCallback((key: string, value: string) => {
        // Parse basePath to extract any existing params (e.g. tab=completed)
        const [baseUrl, baseQuery] = basePath.split("?");
        const params = new URLSearchParams(baseQuery ?? "");
        // Carry over filter params
        if (value === "All") params.delete(key);
        else params.set(key, value);
        const qs = params.toString();
        router.push(qs ? `${baseUrl}?${qs}` : baseUrl);
    }, [router, basePath]);

    return (
        <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
                <span className="text-light-400 text-sm">Level:</span>
                <div className="flex gap-1">
                    {LEVELS.map(l => (
                        <button
                            key={l}
                            onClick={() => update("level", l)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                                ${level === l ? "bg-primary-200 text-dark-100" : "bg-dark-200 text-light-400 hover:text-white"}`}
                        >
                            {l}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-light-400 text-sm">Type:</span>
                <div className="flex gap-1">
                    {TYPES.map(t => (
                        <button
                            key={t}
                            onClick={() => update("type", t)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                                ${type === t ? "bg-primary-200 text-dark-100" : "bg-dark-200 text-light-400 hover:text-white"}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default InterviewFilters;
