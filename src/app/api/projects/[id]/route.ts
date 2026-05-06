import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/middleware/authMiddleware"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = requireAuth(req)

        const project = await prisma.project.findFirst({
            where: {
                id,
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
                tasks: {
                    include: {
                        assignee: { select: { id: true, name: true, email: true } },
                    },
                },
            },
        })

        if (!project) {
            return NextResponse.json(
                { success: false, error: "Project not found" },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true, data: project })
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

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = requireAuth(req)

        const task = await prisma.task.findFirst({
            where: { id },
            include: {
                project: {
                    include: {
                        members: true,
                    },
                },
            },
        })

        if (!task) {
            return NextResponse.json(
                { success: false, error: "Task not found" },
                { status: 404 }
            )
        }

        const member = task.project.members.find(
            (m) => m.userId === user.userId
        )

        if (!member) {
            return NextResponse.json(
                { success: false, error: "Not a member of this project" },
                { status: 403 }
            )
        }

        if (member.role !== "ADMIN" && task.project.ownerId !== user.userId) {
            return NextResponse.json(
                { success: false, error: "Only admins can delete tasks" },
                { status: 403 }
            )
        }

        await prisma.task.delete({ where: { id } })

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