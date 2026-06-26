import { defineConfig } from "prisma/config";

// Load .env only in local dev — on Render, DATABASE_URL is set via environment variables
try {
  require("dotenv").config();
} catch {
  // dotenv not available or no .env file — that's fine on Render
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || "file:dev.db",
  },
});

