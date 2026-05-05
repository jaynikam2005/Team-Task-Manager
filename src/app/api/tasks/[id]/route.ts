import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/middleware/authMiddleware"

const updateTaskSchema = z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE", "OVERDUE"]).optional(),
    assigneeId: z.string().optional(),
    dueDate: z.string().optional(),
})

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = requireAuth(req)
        const body = await req.json()
        const updates = updateTaskSchema.parse(body)

        const task = await prisma.task.findFirst({
            where: {
                id: params.id,
                project: {
                    OR: [
                        { ownerId: user.userId },
                        { members: { some: { userId: user.userId } } },
                    ],
                },
            },
        })

        if (!task) {
            return NextResponse.json(
                { success: false, error: "Task not found or not authorized" },
                { status: 404 }
            )
        }

        const updated = await prisma.task.update({
            where: { id: params.id },
            data: {
                ...updates,
                dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
            },
            include: {
                assignee: { select: { id: true, name: true, email: true } },
                project: { select: { id: true, name: true } },
            },
        })

        return NextResponse.json({ success: true, data: updated })
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

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = requireAuth(req)

        const task = await prisma.task.findFirst({
            where: {
                id: params.id,
                project: {
                    OR: [
                        { ownerId: user.userId },
                        { members: { some: { userId: user.userId } } },
                    ],
                },
            },
        })

        if (!task) {
            return NextResponse.json(
                { success: false, error: "Task not found or not authorized" },
                { status: 404 }
            )
        }

        await prisma.task.delete({ where: { id: params.id } })

        return NextResponse.json({ success: true, message: "Task deleted" })
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