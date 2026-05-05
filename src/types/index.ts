export interface JwtPayload {
    userId: string
    email: string
    role?: string
}

export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    message?: string
    error?: string
}