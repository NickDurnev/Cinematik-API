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
    url: process.env.DATABASE_URL,
    ssl: (() => {
      const raw = process.env.DATABASE_SSL_CA;
      const ca = raw ? raw.replace(/\\n/g, "\n") : undefined;
      return ca ? { ca, rejectUnauthorized: true } : true;
    })(),
  },
});
