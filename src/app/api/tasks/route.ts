import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/middleware/authMiddleware"

const createTaskSchema = z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    projectId: z.string(),
    assigneeId: z.string().optional(),
    dueDate: z.string().optional(),
})

export async function GET(req: NextRequest) {
    try {
        const user = requireAuth(req)
        const { searchParams } = new URL(req.url)
        const projectId = searchParams.get("projectId")

        const tasks = await prisma.task.findMany({
            where: {
                project: {
                    OR: [
                        { ownerId: user.userId },
                        { members: { some: { userId: user.userId } } },
                    ],
                },
                ...(projectId ? { projectId } : {}),
            },
            include: {
                assignee: { select: { id: true, name: true, email: true } },
                project: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json({ success: true, data: tasks })
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
        const { title, description, projectId, assigneeId, dueDate } =
            createTaskSchema.parse(body)

        const member = await prisma.projectMember.findUnique({
            where: {
                userId_projectId: { userId: user.userId, projectId },
            },
        })

        if (!member) {
            return NextResponse.json(
                { success: false, error: "Not a member of this project" },
                { status: 403 }
            )
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                projectId,
                assigneeId,
                dueDate: dueDate ? new Date(dueDate) : undefined,
            },
            include: {
                assignee: { select: { id: true, name: true, email: true } },
                project: { select: { id: true, name: true } },
            },
        })

        return NextResponse.json({ success: true, data: task }, { status: 201 })
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            )
        }
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        )
    }
}