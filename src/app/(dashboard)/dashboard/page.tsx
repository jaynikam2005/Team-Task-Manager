"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/authStore"
import api from "@/lib/api"

interface Task {
    id: string
    title: string
    status: string
    dueDate: string | null
    project: { id: string; name: string }
    assignee: { id: string; name: string } | null
}

interface Stats {
    total: number
    todo: number
    inProgress: number
    done: number
    overdue: number
}

export default function DashboardPage() {
    const { user } = useAuthStore()
    const [tasks, setTasks] = useState<Task[]>([])
    const [stats, setStats] = useState<Stats>({
        total: 0,
        todo: 0,
        inProgress: 0,
        done: 0,
        overdue: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchTasks() {
            try {
                const res = await api.get("/tasks")
                const allTasks: Task[] = res.data.data

                const now = new Date()
                const computed: Stats = {
                    total: allTasks.length,
                    todo: allTasks.filter((t) => t.status === "TODO").length,
                    inProgress: allTasks.filter((t) => t.status === "IN_PROGRESS").length,
                    done: allTasks.filter((t) => t.status === "DONE").length,
                    overdue: allTasks.filter(
                        (t) =>
                            t.dueDate &&
                            new Date(t.dueDate) < now &&
                            t.status !== "DONE"
                    ).length,
                }

                setStats(computed)
                setTasks(allTasks.slice(0, 10))
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchTasks()
    }, [])

    function getStatusBadge(status: string) {
        const map: Record<string, string> = {
            TODO: "secondary",
            IN_PROGRESS: "default",
            DONE: "outline",
            OVERDUE: "destructive",
        }
        return map[status] || "secondary"
    }

    if (loading) return <p className="text-muted-foreground">Loading...</p>

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">
                    Welcome back, {user?.name}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Here's what's happening with your tasks
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">
                            Total tasks
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">
                            In progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold text-blue-500">
                            {stats.inProgress}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">
                            Completed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold text-green-500">
                            {stats.done}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">
                            Overdue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold text-red-500">
                            {stats.overdue}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div>
                <h2 className="text-lg font-medium mb-3">Recent tasks</h2>
                {tasks.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No tasks yet.</p>
                ) : (
                    <div className="space-y-2">
                        {tasks.map((task) => (
                            <Card key={task.id}>
                                <CardContent className="py-3 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-sm">{task.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {task.project.name}
                                            {task.assignee ? ` · ${task.assignee.name}` : ""}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {task.dueDate && (
                                            <span className="text-xs text-muted-foreground">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                                        )}
                                        <Badge variant={getStatusBadge(task.status) as any}>
                                            {task.status.replace("_", " ")}
                                        </Badge>
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