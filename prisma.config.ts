import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Read lazily: `prisma generate` must work without a database URL (CI).
    // `prisma migrate deploy` gets DATABASE_URL from the workflow env.
    url: process.env.DATABASE_URL,
  },
});
