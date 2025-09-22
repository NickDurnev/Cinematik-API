import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load environment variables based on STAGE
const stage = process.env.STAGE || "dev";
dotenv.config({ path: `.env.stage.${stage}` });

export default defineConfig({
  schema: "./src/**/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    ssl: {
      ca: process.env.DATABASE_SSL_CA,
      rejectUnauthorized: true,
    },
  },
});
