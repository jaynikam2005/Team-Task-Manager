import path from "path"
import type { PrismaConfig } from "prisma"

export default {
    earlyAccess: true,
    schema: path.join("prisma", "schema.prisma"),
    migrate: {
        adapter: async () => {
            const { PrismaPg } = await import("@prisma/adapter-pg")
            return new PrismaPg({
                connectionString: process.env.DATABASE_URL,
            })
        },
    },
} satisfies PrismaConfig