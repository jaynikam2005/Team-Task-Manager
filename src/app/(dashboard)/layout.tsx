"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const { user, isAuthenticated, logout } = useAuthStore()

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login")
        }
    }, [isAuthenticated, router])

    async function handleLogout() {
        try {
            await api.post("/auth/logout")
        } catch {}
        logout()
        toast.success("Logged out")
        router.push("/login")
    }

    if (!isAuthenticated) return null

    return (
        <div className="min-h-screen bg-background">
            <nav className="border-b px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="font-semibold text-lg">
                        TaskManager
                    </Link>
                    <Link
                        href="/dashboard"
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/dashboard/projects"
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        Projects
                    </Link>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{user?.name}</span>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                        Logout
                    </Button>
                </div>
            </nav>
            <main className="p-6">{children}</main>
        </div>
    )
}