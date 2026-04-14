"use client";

interface DataPoint {
    id: string;
    totalScore: number;
    createdAt: string;
    interviewId: string;
}

const ScoreChart = ({ data }: { data: DataPoint[] }) => {
    if (data.length < 2) {
        return (
            <div className="flex items-center justify-center h-32 text-light-400 text-sm">
                Complete at least 2 interviews to see your progress chart.
            </div>
        );
    }

    const W = 600;
    const H = 200;
    const PAD = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;

    const minScore = Math.max(0, Math.min(...data.map(d => d.totalScore)) - 10);
    const maxScore = Math.min(100, Math.max(...data.map(d => d.totalScore)) + 10);

    const xStep = chartW / (data.length - 1);
    const yScale = (score: number) =>
        chartH - ((score - minScore) / (maxScore - minScore)) * chartH;

    const points = data.map((d, i) => ({
        x: PAD.left + i * xStep,
        y: PAD.top + yScale(d.totalScore),
        score: d.totalScore,
        date: new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        interviewId: d.interviewId,
    }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${H - PAD.bottom} L ${points[0].x} ${H - PAD.bottom} Z`;

    const yLabels = [0, 25, 50, 75, 100].filter(v => v >= minScore && v <= maxScore);

    return (
        <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 300 }}>
                {/* Grid lines */}
                {yLabels.map(v => (
                    <g key={v}>
                        <line
                            x1={PAD.left} y1={PAD.top + yScale(v)}
                            x2={W - PAD.right} y2={PAD.top + yScale(v)}
                            stroke="#27282f" strokeWidth="1"
                        />
                        <text x={PAD.left - 6} y={PAD.top + yScale(v) + 4} textAnchor="end" fontSize="10" fill="#6870a6">{v}</text>
                    </g>
                ))}

                {/* Area fill */}
                <path d={areaD} fill="url(#areaGrad)" opacity="0.3" />

                {/* Line */}
                <path d={pathD} fill="none" stroke="#cac5fe" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

                {/* Gradient */}
                <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#cac5fe" />
                        <stop offset="100%" stopColor="#cac5fe" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Points */}
                {points.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r="5" fill="#cac5fe" stroke="#020408" strokeWidth="2" />
                        <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10" fill="#dddfff" fontWeight="600">
                            {p.score}
                        </text>
                        <text x={p.x} y={H - PAD.bottom + 16} textAnchor="middle" fontSize="9" fill="#6870a6">
                            {p.date}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
};

export default ScoreChart;
