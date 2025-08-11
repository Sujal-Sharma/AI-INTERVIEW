"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth.action";
import { useTransition } from "react";

export default function LogoutButton() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleLogout = async () => {
        startTransition(async () => {
            await logout();
            router.push("/sign-in");
        });
    };

    return (
        <Button
            className="ml-4 btn-secondary"
            onClick={handleLogout}
            disabled={isPending}
            type="button"
        >
            {isPending ? "Logging out..." : "Log out"}
        </Button>
    );
}
