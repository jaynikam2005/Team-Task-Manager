"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"

interface Task {
    id: string
    title: string
    description: string | null
    status: string
    dueDate: string | null
    assignee: { id: string; name: string } | null
}

interface Project {
    id: string
    name: string
    description: string | null
    owner: { id: string; name: string }
    members: { role: string; user: { id: string; name: string } }[]
    tasks: Task[]
}

const STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "DONE", "OVERDUE"]

export default function ProjectPage() {
    const { id } = useParams()
    const [project, setProject] = useState<Project | null>(null)
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [creating, setCreating] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [dueDate, setDueDate] = useState("")
    const [assigneeId, setAssigneeId] = useState("")

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
        } catch {
            toast.error("Failed to delete task")
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
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancel" : "Add task"}
                </Button>
            </div>

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

            <div className="space-y-2">
                <h2 className="text-lg font-medium">
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
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDeleteTask(task.id)}
                                        >
                                            Delete
                                        </Button>
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