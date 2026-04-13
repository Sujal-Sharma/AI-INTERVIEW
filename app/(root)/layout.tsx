import { ReactNode } from 'react';
import Link from "next/link";
import Image from 'next/image';
import { isAuthenticated } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

const RootLayout = async ({ children }: { children: ReactNode }) => {
    const isUserAuthenticated = await isAuthenticated();
    if (!isUserAuthenticated) redirect('/sign-in');

    return (
        <div className="root-layout">
            <nav className="flex items-center justify-between w-full">
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/logo.svg" alt="logo" width={38} height={32} />
                    <h2 className="text-primary-100">HireAI</h2>
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/profile" className="text-sm text-light-400 hover:text-white transition-colors">
                        Profile
                    </Link>
                    <LogoutButton />
                </div>
            </nav>
            {children}
        </div>
    );
};

export default RootLayout;
