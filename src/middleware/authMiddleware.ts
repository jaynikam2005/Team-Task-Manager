import { NextRequest } from "next/server"
import { verifyToken } from "@/lib/auth"
import { JwtPayload } from "@/types"

export function getAuthUser(req: NextRequest): JwtPayload | null {
    try {
        const token = req.cookies.get("token")?.value
        if (!token) return null
        return verifyToken(token)
    } catch {
        return null
    }
}

export function requireAuth(req: NextRequest): JwtPayload {
    const user = getAuthUser(req)
    if (!user) throw new Error("Unauthorized")
    return user
}