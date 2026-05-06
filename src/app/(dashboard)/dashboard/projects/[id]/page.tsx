"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/authStore"
import api from "@/lib/api"

interface Task {
    id: string
    title: string
    description: string | null
    status: string
    dueDate: string | null
    assignee: { id: string; name: string } | null
}

interface Member {
    role: string
    user: { id: string; name: string; email: string }
}

interface Project {
    id: string
    name: string
    description: string | null
    owner: { id: string; name: string }
    members: Member[]
    tasks: Task[]
}

const STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "DONE", "OVERDUE"]

export default function ProjectPage() {
    const { id } = useParams()
    const { user } = useAuthStore()
    const [project, setProject] = useState<Project | null>(null)
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [showInvite, setShowInvite] = useState(false)
    const [creating, setCreating] = useState(false)
    const [inviting, setInviting] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [dueDate, setDueDate] = useState("")
    const [assigneeId, setAssigneeId] = useState("")
    const [inviteEmail, setInviteEmail] = useState("")

    useEffect(() => {
        fetchProject()
    }, [id])

    async function fetchProject() {
        try {
            const res = await api.get(`/projects/${id}`)
            setProject(res.data.data)
        } catch {
            toast.error("Failed to load project")
        } finally {
            setLoading(false)
        }
    }

    function isAdmin() {
        if (!project || !user) return false
        const member = project.members.find((m) => m.user.id === user.id)
        return member?.role === "ADMIN"
    }

    async function handleCreateTask() {
        if (!title.trim()) return
        try {
            setCreating(true)
            await api.post("/tasks", {
                title,
                description,
                projectId: id,
                assigneeId: assigneeId || undefined,
                dueDate: dueDate || undefined,
            })
            toast.success("Task created!")
            setTitle("")
            setDescription("")
            setDueDate("")
            setAssigneeId("")
            setShowForm(false)
            fetchProject()
        } catch {
            toast.error("Failed to create task")
        } finally {
            setCreating(false)
        }
    }

    async function handleInviteMember() {
        if (!inviteEmail.trim()) return
        try {
            setInviting(true)
            await api.post(`/projects/${id}/members`, { email: inviteEmail })
            toast.success("Member invited!")
            setInviteEmail("")
            setShowInvite(false)
            fetchProject()
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to invite member")
        } finally {
            setInviting(false)
        }
    }

    async function handleRemoveMember(memberId: string) {
        try {
            await api.delete(`/projects/${id}/members?userId=${memberId}`)
            toast.success("Member removed")
            fetchProject()
        } catch {
            toast.error("Failed to remove member")
        }
    }

    async function handleStatusChange(taskId: string, status: string) {
        try {
            await api.patch(`/tasks/${taskId}`, { status })
            toast.success("Status updated")
            fetchProject()
        } catch {
            toast.error("Failed to update status")
        }
    }

    async function handleDeleteTask(taskId: string) {
        try {
            await api.delete(`/tasks/${taskId}`)
            toast.success("Task deleted")
            fetchProject()
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to delete task")
        }
    }

    function getStatusColor(status: string) {
        const map: Record<string, string> = {
            TODO: "secondary",
            IN_PROGRESS: "default",
            DONE: "outline",
            OVERDUE: "destructive",
        }
        return map[status] || "secondary"
    }

    if (loading) return <p className="text-muted-foreground">Loading...</p>
    if (!project) return <p className="text-muted-foreground">Project not found</p>

    const admin = isAdmin()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">{project.name}</h1>
                    {project.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                            {project.description}
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    {admin && (
                        <Button variant="outline" onClick={() => setShowInvite(!showInvite)}>
                            {showInvite ? "Cancel" : "Invite member"}
                        </Button>
                    )}
                    <Button onClick={() => setShowForm(!showForm)}>
                        {showForm ? "Cancel" : "Add task"}
                    </Button>
                </div>
            </div>

            {showInvite && admin && (
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label>Invite by email</Label>
                            <Input
                                placeholder="teammate@example.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleInviteMember} disabled={inviting}>
                            {inviting ? "Inviting..." : "Send invite"}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {showForm && (
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                placeholder="Task title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description (optional)</Label>
                            <Input
                                placeholder="Task description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Due date (optional)</Label>
                                <Input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Assign to</Label>
                                <select
                                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                                    value={assigneeId}
                                    onChange={(e) => setAssigneeId(e.target.value)}
                                >
                                    <option value="">Unassigned</option>
                                    {project.members.map((m) => (
                                        <option key={m.user.id} value={m.user.id}>
                                            {m.user.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <Button onClick={handleCreateTask} disabled={creating}>
                            {creating ? "Creating..." : "Create task"}
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div>
                <h2 className="text-lg font-medium mb-3">
                    Members ({project.members.length})
                </h2>
                <div className="flex flex-wrap gap-2 mb-6">
                    {project.members.map((m) => (
                        <div
                            key={m.user.id}
                            className="flex items-center gap-2 border rounded-full px-3 py-1 text-sm"
                        >
                            <span>{m.user.name}</span>
                            <Badge variant="outline">{m.role}</Badge>
                            {admin && m.user.id !== user?.id && (
                                <button
                                    onClick={() => handleRemoveMember(m.user.id)}
                                    className="text-destructive hover:text-destructive/80 text-xs ml-1"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <h2 className="text-lg font-medium mb-3">
                    Tasks ({project.tasks.length})
                </h2>
                {project.tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No tasks yet. Add your first task.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {project.tasks.map((task) => (
                            <Card key={task.id}>
                                <CardContent className="py-3 flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{task.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {task.assignee && (
                                                <span className="text-xs text-muted-foreground">
                          {task.assignee.name}
                        </span>
                                            )}
                                            {task.dueDate && (
                                                <span className="text-xs text-muted-foreground">
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            className="text-xs border rounded px-2 py-1 bg-background"
                                            value={task.status}
                                            onChange={(e) =>
                                                handleStatusChange(task.id, e.target.value)
                                            }
                                        >
                                            {STATUS_OPTIONS.map((s) => (
                                                <option key={s} value={s}>
                                                    {s.replace("_", " ")}
                                                </option>
                                            ))}
                                        </select>
                                        <Badge variant={getStatusColor(task.status) as any}>
                                            {task.status.replace("_", " ")}
                                        </Badge>
                                        {admin && (
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDeleteTask(task.id)}
                                            >
                                                Delete
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}