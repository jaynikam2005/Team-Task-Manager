import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/middleware/authMiddleware"

const createProjectSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
})

export async function GET(req: NextRequest) {
    try {
        const user = requireAuth(req)

        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { ownerId: user.userId },
                    { members: { some: { userId: user.userId } } },
                ],
            },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
                _count: { select: { tasks: true } },
            },
        })

        return NextResponse.json({ success: true, data: projects })
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            )
        }
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = requireAuth(req)
        const body = await req.json()
        const { name, description } = createProjectSchema.parse(body)

        const project = await prisma.project.create({
            data: {
                name,
                description,
                ownerId: user.userId,
                members: {
                    create: {
                        userId: user.userId,
                        role: "ADMIN",
                    },
                },
            },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
            },
        })

        return NextResponse.json({ success: true, data: project }, { status: 201 })
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            )
        }
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