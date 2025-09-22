import * as fs from "fs";

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
      const caFromEnv = raw ? raw.replace(/\\n/g, "\n") : undefined;
      if (caFromEnv) {
        return { ca: caFromEnv, rejectUnauthorized: true } as const;
      }
      const caPath = process.env.PGSSLROOTCERT;
      if (caPath && fs.existsSync(caPath)) {
        try {
          const caFromFile = fs.readFileSync(caPath, "utf8");
          return { ca: caFromFile, rejectUnauthorized: true } as const;
        } catch {
          return true as const;
        }
      }
      return true as const;
    })(),
  },
});
