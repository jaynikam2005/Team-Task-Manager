import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/middleware/authMiddleware"

const inviteSchema = z.object({
    email: z.string().email(),
})

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = requireAuth(req)
        const body = await req.json()
        const { email } = inviteSchema.parse(body)

        const member = await prisma.projectMember.findUnique({
            where: {
                userId_projectId: { userId: user.userId, projectId: id },
            },
        })

        if (!member || member.role !== "ADMIN") {
            return NextResponse.json(
                { success: false, error: "Only admins can invite members" },
                { status: 403 }
            )
        }

        const invitedUser = await prisma.user.findUnique({
            where: { email },
        })

        if (!invitedUser) {
            return NextResponse.json(
                { success: false, error: "User with this email not found" },
                { status: 404 }
            )
        }

        const existingMember = await prisma.projectMember.findUnique({
            where: {
                userId_projectId: { userId: invitedUser.id, projectId: id },
            },
        })

        if (existingMember) {
            return NextResponse.json(
                { success: false, error: "User is already a member" },
                { status: 400 }
            )
        }

        const newMember = await prisma.projectMember.create({
            data: {
                userId: invitedUser.id,
                projectId: id,
                role: "MEMBER",
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        })

        return NextResponse.json({ success: true, data: newMember }, { status: 201 })
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

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = requireAuth(req)
        const { searchParams } = new URL(req.url)
        const memberId = searchParams.get("userId")

        if (!memberId) {
            return NextResponse.json(
                { success: false, error: "userId is required" },
                { status: 400 }
            )
        }

        const member = await prisma.projectMember.findUnique({
            where: {
                userId_projectId: { userId: user.userId, projectId: id },
            },
        })

        if (!member || member.role !== "ADMIN") {
            return NextResponse.json(
                { success: false, error: "Only admins can remove members" },
                { status: 403 }
            )
        }

        await prisma.projectMember.delete({
            where: {
                userId_projectId: { userId: memberId, projectId: id },
            },
        })

        return NextResponse.json({ success: true, message: "Member removed" })
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