import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/middleware/authMiddleware"

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = requireAuth(req)

        const project = await prisma.project.findFirst({
            where: {
                id: params.id,
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
    { params }: { params: { id: string } }
) {
    try {
        const user = requireAuth(req)

        const project = await prisma.project.findFirst({
            where: { id: params.id, ownerId: user.userId },
        })

        if (!project) {
            return NextResponse.json(
                { success: false, error: "Project not found or not authorized" },
                { status: 404 }
            )
        }

        await prisma.project.delete({ where: { id: params.id } })

        return NextResponse.json({ success: true, message: "Project deleted" })
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