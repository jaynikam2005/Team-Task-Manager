import path from "path"

export default {
    schema: path.join("prisma", "schema.prisma"),
    datasource: {
        url: process.env.DATABASE_MIGRATE_URL || process.env.DATABASE_URL,
    },
}