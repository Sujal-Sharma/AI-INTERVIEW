import React from 'react'
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from 'next/image'

const features = [
    {
        icon: "🎙️",
        title: "AI Voice Interviews",
        desc: "Practice with a real-time AI interviewer that speaks, listens, and responds — just like a real interview.",
    },
    {
        icon: "📄",
        title: "Resume-Based Questions",
        desc: "Upload your resume and get interview questions tailored specifically to your experience and tech stack.",
    },
    {
        icon: "📊",
        title: "ATS Score Checker",
        desc: "Find out if your resume passes Applicant Tracking Systems before you even apply.",
    },
    {
        icon: "✨",
        title: "AI Resume Improver",
        desc: "Get specific bullet rewrites, missing skills, and power words to make your resume stand out.",
    },
    {
        icon: "🏢",
        title: "Company-Wise Questions",
        desc: "Get the exact questions asked at Google, Amazon, Microsoft, and more — filtered by role and level.",
    },
    {
        icon: "💬",
        title: "Resume Q&A Chat",
        desc: "Ask anything about your background. AI answers based only on what's in your resume.",
    },
    {
        icon: "🛠️",
        title: "Resume Builder",
        desc: "Paste a job description and get a full ATS-optimized resume generated or optimized in seconds.",
    },
    {
        icon: "📈",
        title: "Progress Tracking",
        desc: "Track your scores across every interview, see trends, and know exactly what to improve.",
    },
];

const steps = [
    { step: "01", title: "Create or Upload", desc: "Start a voice interview or upload your resume to generate a personalized session." },
    { step: "02", title: "Practice with AI", desc: "The AI interviewer asks questions and listens — give real answers out loud." },
    { step: "03", title: "Get Feedback", desc: "Receive a detailed scorecard, strengths, weaknesses, and a 7-day study plan." },
];

const Page = async () => {
    return (
        <>
            {/* Hero */}
            <section className="card-cta">
                <div className="flex flex-col gap-6 max-w-lg">
                    <div className="inline-flex items-center gap-2 bg-primary-200/10 border border-primary-200/20 rounded-full px-4 py-1.5 w-fit">
                        <span className="size-2 rounded-full bg-success-100 animate-pulse" />
                        <span className="text-xs text-primary-100 font-medium">AI-Powered Interview Prep</span>
                    </div>
                    <h2 className="text-4xl font-bold leading-tight">
                        Get Interview Ready with AI-Powered Practice &amp; Feedback
                    </h2>
                    <p className="text-lg text-light-400">
                        Create a custom interview, practise with AI, and get instant feedback
                    </p>
                    <div className="flex gap-3 flex-wrap">
                        <Button asChild className="btn-primary max-sm:w-full">
                            <Link href="/interview/create">Create Interview</Link>
                        </Button>
                        <Button asChild className="btn-secondary max-sm:w-full">
                            <Link href="/interview/resume">Upload Resume</Link>
                        </Button>
                    </div>
                </div>
                <Image src="/robot.png" alt="robo-dude" width={400} height={400} className="max-sm:hidden" />
            </section>

            {/* How it works */}
            <section className="flex flex-col gap-8 mt-16">
                <div className="text-center flex flex-col gap-2">
                    <h2 className="text-2xl font-bold">How It Works</h2>
                    <p className="text-light-400">Three simple steps to ace your next interview</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {steps.map((s) => (
                        <div key={s.step} className="flex flex-col gap-3 bg-dark-200 rounded-2xl p-6 border border-light-600/10">
                            <span className="text-4xl font-black text-primary-200/20">{s.step}</span>
                            <h3 className="text-white font-semibold text-lg">{s.title}</h3>
                            <p className="text-light-400 text-sm leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features grid */}
            <section className="flex flex-col gap-8 mt-16">
                <div className="text-center flex flex-col gap-2">
                    <h2 className="text-2xl font-bold">Everything You Need to Land the Job</h2>
                    <p className="text-light-400">A complete interview prep toolkit — all in one place</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {features.map((f) => (
                        <div key={f.title} className="flex flex-col gap-3 bg-dark-200 rounded-2xl p-5 border border-light-600/10 hover:border-primary-200/20 transition-colors group">
                            <span className="text-3xl">{f.icon}</span>
                            <h3 className="text-white font-semibold text-sm">{f.title}</h3>
                            <p className="text-light-400 text-xs leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Stats banner */}
            <section className="mt-16 bg-dark-200 rounded-2xl p-8 border border-light-600/10">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                    {[
                        { value: "10+", label: "Interview Tools" },
                        { value: "AI", label: "Voice Interviewer" },
                        { value: "ATS", label: "Resume Analysis" },
                        { value: "Free", label: "To Get Started" },
                    ].map((stat) => (
                        <div key={stat.label} className="flex flex-col gap-1">
                            <p className="text-3xl font-black text-primary-100">{stat.value}</p>
                            <p className="text-light-400 text-sm">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA bottom */}
            <section className="mt-16 flex flex-col items-center gap-5 text-center pb-8">
                <h2 className="text-2xl font-bold">Ready to Start Practising?</h2>
                <p className="text-light-400 max-w-md">Join thousands of candidates who use HireAI to prepare for technical and behavioral interviews.</p>
                <div className="flex gap-3 flex-wrap justify-center">
                    <Button asChild className="btn-primary">
                        <Link href="/interview/create">Start Voice Interview</Link>
                    </Button>
                    <Button asChild className="btn-secondary">
                        <Link href="/my-interviews">View My Interviews</Link>
                    </Button>
                </div>
            </section>
        </>
    );
};

export default Page;
