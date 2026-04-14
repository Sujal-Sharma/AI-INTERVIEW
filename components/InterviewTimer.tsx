"use client";
import { useEffect, useState } from "react";

const InterviewTimer = ({ durationMinutes = 30 }: { durationMinutes?: number }) => {
    const [seconds, setSeconds] = useState(durationMinutes * 60);
    const [active, setActive] = useState(false);

    useEffect(() => {
        if (!active || seconds <= 0) return;
        const interval = setInterval(() => setSeconds(s => s - 1), 1000);
        return () => clearInterval(interval);
    }, [active, seconds]);

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const pct = (seconds / (durationMinutes * 60)) * 100;
    const isLow = seconds < 300; // under 5 min

    return (
        <div className="flex flex-col items-center gap-2">
            <div className={`text-2xl font-bold tabular-nums ${isLow && active ? 'text-destructive-100 animate-pulse' : 'text-white'}`}>
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
            <div className="w-32 h-1.5 rounded-full bg-dark-200">
                <div
                    className={`h-1.5 rounded-full transition-all ${isLow ? 'bg-destructive-100' : 'bg-success-100'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <button
                onClick={() => setActive(a => !a)}
                className="text-xs text-light-400 hover:text-white transition-colors"
            >
                {active ? 'Pause Timer' : seconds === durationMinutes * 60 ? 'Start Timer' : 'Resume'}
            </button>
        </div>
    );
};

export default InterviewTimer;
