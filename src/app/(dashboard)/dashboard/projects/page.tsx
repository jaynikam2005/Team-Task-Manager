"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/authStore"
import api from "@/lib/api"

interface Project {
    id: string
    name: string
    description: string | null
    owner: { id: string; name: string }
    _count: { tasks: number }
    members: { role: string; user: { id: string; name: string } }[]
}

export default function ProjectsPage() {
    const router = useRouter()
    const { user } = useAuthStore()
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")

    useEffect(() => {
        fetchProjects()
    }, [])

    async function fetchProjects() {
        try {
            const res = await api.get("/projects")
            setProjects(res.data.data)
        } catch {
            toast.error("Failed to load projects")
        } finally {
            setLoading(false)
        }
    }

    async function handleCreate() {
        if (!name.trim()) return
        try {
            setCreating(true)
            await api.post("/projects", { name, description })
            toast.success("Project created!")
            setName("")
            setDescription("")
            setShowForm(false)
            fetchProjects()
        } catch {
            toast.error("Failed to create project")
        } finally {
            setCreating(false)
        }
    }

    async function handleDelete(id: string) {
        try {
            await api.delete(`/projects/${id}`)
            toast.success("Project deleted")
            fetchProjects()
        } catch {
            toast.error("Failed to delete project")
        }
    }

    function isProjectAdmin(project: Project) {
        if (!user) return false
        const member = project.members.find((m) => m.user.id === user.id)
        return member?.role === "ADMIN"
    }

    if (loading) return <p className="text-muted-foreground">Loading...</p>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Projects</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your team projects
                    </p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancel" : "New project"}
                </Button>
            </div>

            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Create new project</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                placeholder="Project name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description (optional)</Label>
                            <Input
                                placeholder="What is this project about?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleCreate} disabled={creating}>
                            {creating ? "Creating..." : "Create project"}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {projects.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                    No projects yet. Create your first one.
                </p>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                        <Card key={project.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-base">{project.name}</CardTitle>
                                    <Badge variant="outline">
                                        {project.members.find((m) => m.user.id === user?.id)
                                            ?.role || "MEMBER"}
                                    </Badge>
                                </div>
                                {project.description && (
                                    <p className="text-sm text-muted-foreground">
                                        {project.description}
                                    </p>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                                    <span>{project._count.tasks} tasks</span>
                                    <span>{project.members.length} members</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        className="flex-1"
                                        onClick={() =>
                                            router.push(`/dashboard/projects/${project.id}`)
                                        }
                                    >
                                        View
                                    </Button>
                                    {isProjectAdmin(project) && (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDelete(project.id)}
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
    )
}