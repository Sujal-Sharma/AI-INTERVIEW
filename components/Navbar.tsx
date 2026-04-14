"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

interface DropdownItem {
    label: string;
    href: string;
    description: string;
    icon: string;
}

interface NavDropdown {
    label: string;
    items: DropdownItem[];
}

const navItems: NavDropdown[] = [
    {
        label: "Interviews",
        items: [
            {
                label: "Voice Interview",
                href: "/interview/create",
                description: "AI-powered voice mock interview",
                icon: "🎙️",
            },
            {
                label: "Resume Interview",
                href: "/interview/resume",
                description: "Questions tailored to your resume",
                icon: "📄",
            },
            {
                label: "Sample Interviews",
                href: "/sample-interviews",
                description: "Practice with interviews from other users",
                icon: "🗂️",
            },
        ],
    },
    {
        label: "Resume Tools",
        items: [
            {
                label: "ATS Score Checker",
                href: "/tools/ats",
                description: "Check how your resume scores with ATS",
                icon: "📊",
            },
            {
                label: "Resume Improver",
                href: "/tools/improve-resume",
                description: "Get AI feedback to improve your resume",
                icon: "✨",
            },
            {
                label: "Resume Q&A",
                href: "/tools/resume-qa",
                description: "Text-based Q&A from your resume",
                icon: "💬",
            },
            {
                label: "Resume Builder",
                href: "/tools/resume-builder",
                description: "Generate or optimize resume from JD",
                icon: "🛠️",
            },
        ],
    },
    {
        label: "Research",
        items: [
            {
                label: "Company Questions",
                href: "/tools/company-questions",
                description: "Top questions asked by specific companies",
                icon: "🏢",
            },
        ],
    },
];

const Navbar = () => {
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const navRef = useRef<HTMLElement>(null);
    const pathname = usePathname();

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(e.target as Node)) {
                setOpenMenu(null);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    useEffect(() => {
        setOpenMenu(null);
        setMobileOpen(false);
    }, [pathname]);

    return (
        <nav ref={navRef} className="flex items-center justify-between w-full relative z-50">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
                <Image src="/logo.svg" alt="logo" width={38} height={32} />
                <h2 className="text-primary-100">HireAI</h2>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
                {navItems.map((nav) => (
                    <div key={nav.label} className="relative">
                        <button
                            onClick={() => setOpenMenu(openMenu === nav.label ? null : nav.label)}
                            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                ${openMenu === nav.label ? "text-white bg-dark-200" : "text-light-400 hover:text-white hover:bg-dark-200/50"}`}
                        >
                            {nav.label}
                            <svg
                                className={`w-3.5 h-3.5 transition-transform ${openMenu === nav.label ? "rotate-180" : ""}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {openMenu === nav.label && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-dark-200 border border-light-600/20 rounded-xl shadow-xl overflow-hidden">
                                {nav.items.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="flex items-start gap-3 px-4 py-3 hover:bg-dark-300 transition-colors group"
                                    >
                                        <span className="text-xl mt-0.5 shrink-0">{item.icon}</span>
                                        <div>
                                            <p className="text-sm font-medium text-white group-hover:text-primary-100 transition-colors">
                                                {item.label}
                                            </p>
                                            <p className="text-xs text-light-400 mt-0.5">{item.description}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">
                <Link
                    href="/profile"
                    className="text-sm text-light-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-dark-200/50"
                >
                    Profile
                </Link>
                <LogoutButton />
            </div>

            {/* Mobile hamburger */}
            <button
                className="md:hidden p-2 rounded-lg text-light-400 hover:text-white hover:bg-dark-200/50"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {mobileOpen
                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    }
                </svg>
            </button>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-dark-200 border border-light-600/20 rounded-xl shadow-xl overflow-hidden">
                    {navItems.map((nav) => (
                        <div key={nav.label}>
                            <p className="px-4 pt-3 pb-1 text-xs font-semibold text-light-600 uppercase tracking-wider">
                                {nav.label}
                            </p>
                            {nav.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-dark-300 transition-colors"
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    <span className="text-sm text-white">{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    ))}
                    <div className="border-t border-light-600/20 px-4 py-3 flex items-center justify-between">
                        <Link href="/profile" className="text-sm text-light-400 hover:text-white transition-colors">
                            Profile
                        </Link>
                        <LogoutButton />
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
