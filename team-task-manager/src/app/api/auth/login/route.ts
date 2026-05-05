import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { comparePassword, generateToken } from "@/lib/auth"

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
})

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { email, password } = loginSchema.parse(body)

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            return NextResponse.json(
                { success: false, error: "Invalid credentials" },
                { status: 401 }
            )
        }

        const isValid = await comparePassword(password, user.password)
        if (!isValid) {
            return NextResponse.json(
                { success: false, error: "Invalid credentials" },
                { status: 401 }
            )
        }

        const token = generateToken({ userId: user.id, email: user.email })

        const response = NextResponse.json({
            success: true,
            data: { id: user.id, name: user.name, email: user.email },
        })

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        })

        return response
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: error.errors },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        )
    }
}