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
            { label: "Voice Interview", href: "/interview/create", description: "AI-powered voice mock interview", icon: "🎙️" },
            { label: "Resume Interview", href: "/interview/resume", description: "Questions tailored to your resume", icon: "📄" },
            { label: "My Interviews", href: "/my-interviews", description: "View your current & completed interviews", icon: "🗂️" },
            { label: "Sample Interviews", href: "/sample-interviews", description: "Practice with community interviews", icon: "👥" },
        ],
    },
    {
        label: "Resume Tools",
        items: [
            { label: "ATS Score Checker", href: "/tools/ats", description: "Check your resume's ATS score", icon: "📊" },
            { label: "Resume Improver", href: "/tools/improve-resume", description: "AI feedback to improve your resume", icon: "✨" },
            { label: "Resume Q&A", href: "/tools/resume-qa", description: "Chat with your resume", icon: "💬" },
            { label: "Resume Builder", href: "/tools/resume-builder", description: "Generate or optimize resume from JD", icon: "🛠️" },
        ],
    },
    {
        label: "Research",
        items: [
            { label: "Company Questions", href: "/tools/company-questions", description: "Top questions at specific companies", icon: "🏢" },
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
        <nav
            ref={navRef}
            className="flex items-center justify-between w-full relative z-50 bg-dark-200/60 backdrop-blur-md border border-light-600/20 rounded-2xl px-5 py-3"
        >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
                <Image src="/logo.svg" alt="logo" width={32} height={28} />
                <span className="text-lg font-bold text-primary-100 tracking-tight">HireAI</span>
            </Link>

            {/* Desktop nav items */}
            <div className="hidden md:flex items-center gap-1">
                {navItems.map((nav) => (
                    <div key={nav.label} className="relative">
                        <button
                            onClick={() => setOpenMenu(openMenu === nav.label ? null : nav.label)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150
                                ${openMenu === nav.label
                                    ? "bg-primary-200/15 text-primary-100 border border-primary-200/30"
                                    : "text-light-400 hover:text-white hover:bg-white/5 border border-transparent"
                                }`}
                        >
                            {nav.label}
                            <svg
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${openMenu === nav.label ? "rotate-180" : ""}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {openMenu === nav.label && (
                            <div className="absolute top-[calc(100%+8px)] left-0 w-68 bg-dark-100/95 backdrop-blur-xl border border-light-600/20 rounded-2xl shadow-2xl overflow-hidden z-50"
                                style={{ width: "272px" }}>
                                <div className="p-2">
                                    {nav.items.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                                        >
                                            <span className="text-xl mt-0.5 shrink-0">{item.icon}</span>
                                            <div>
                                                <p className="text-sm font-medium text-white group-hover:text-primary-100 transition-colors leading-tight">
                                                    {item.label}
                                                </p>
                                                <p className="text-xs text-light-400 mt-0.5 leading-tight">{item.description}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Right side — Profile + Logout */}
            <div className="hidden md:flex items-center gap-2">
                <Link
                    href="/profile"
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 border
                        ${pathname === "/profile"
                            ? "bg-primary-200/15 text-primary-100 border-primary-200/30"
                            : "text-light-400 hover:text-white hover:bg-white/5 border-transparent"
                        }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                </Link>
                <LogoutButton />
            </div>

            {/* Mobile hamburger */}
            <button
                className="md:hidden p-2 rounded-xl text-light-400 hover:text-white hover:bg-white/5 border border-transparent transition-all"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {mobileOpen
                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    }
                </svg>
            </button>

            {/* Mobile dropdown */}
            {mobileOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-dark-100/95 backdrop-blur-xl border border-light-600/20 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-3">
                        {navItems.map((nav) => (
                            <div key={nav.label} className="mb-2">
                                <p className="px-3 py-1.5 text-xs font-semibold text-light-600 uppercase tracking-wider">
                                    {nav.label}
                                </p>
                                {nav.items.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
                                    >
                                        <span className="text-lg">{item.icon}</span>
                                        <span className="text-sm text-white">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        ))}
                        <div className="border-t border-light-600/20 pt-2 mt-1 flex items-center justify-between px-2">
                            <Link href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-light-400 hover:text-white hover:bg-white/5 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Profile
                            </Link>
                            <LogoutButton />
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
