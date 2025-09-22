import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as userSchema from "@/auth/schema";

import { DATABASE_CONNECTION } from "./database.connection";

export const DrizzleProvider = {
  provide: DATABASE_CONNECTION,
  useFactory: (configService: ConfigService) => {
    const logger = new Logger("DrizzleProvider");

    const databaseUrl = configService.getOrThrow("DATABASE_URL");
    const sslOption = (() => {
      const rawCa = configService.get<string>("DATABASE_SSL_CA");
      const ca = rawCa ? rawCa.replace(/\\n/g, "\n") : undefined;
      return ca ? { ca, rejectUnauthorized: true } : true;
    })();

    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: sslOption,
    });

    // Connection check at startup with helpful logs
    (async () => {
      try {
        const caInfo =
          typeof sslOption === "object" && sslOption?.ca
            ? `custom CA provided (len=${String(sslOption.ca).length})`
            : String(sslOption);
        logger.log(`Initializing database pool. ssl=${caInfo}`);
        await pool.query("SELECT 1");
        logger.log("Database connection check succeeded");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;
        logger.error(`Database connection check failed: ${message}`, stack);
      }
    })();

    return drizzle(pool, { schema: { ...userSchema } });
  },
  inject: [ConfigService],
};
