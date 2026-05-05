import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { hashPassword, generateToken } from "@/lib/auth"

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
})

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { name, email, password } = registerSchema.parse(body)

        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser) {
            return NextResponse.json(
                { success: false, error: "Email already in use" },
                { status: 400 }
            )
        }

        const hashedPassword = await hashPassword(password)

        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword },
        })

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