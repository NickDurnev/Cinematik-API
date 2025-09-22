import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load environment variables based on STAGE
const stage = process.env.STAGE || "dev";
dotenv.config({ path: `.env.stage.${stage}` });

// Modify DATABASE_URL to use sslmode=prefer to allow SSL with fallback
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return url;
  }

  // Replace sslmode=require with sslmode=prefer to allow SSL with fallback
  return url.replace("sslmode=require", "sslmode=prefer");
};

export default defineConfig({
  schema: "./src/**/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
    ssl: (() => {
      const raw = process.env.DATABASE_SSL_CA;
      const ca = raw ? raw.replace(/\\n/g, "\n") : undefined;
      return ca ? { ca, rejectUnauthorized: true } : true;
    })(),
  },
});
