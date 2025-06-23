import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/**/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    port: Number(process.env.PORT),
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },
});
