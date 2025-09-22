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

    const pool = new Pool({
      user: configService.getOrThrow("DB_USER"),
      password: configService.getOrThrow("DB_PASSWORD"),
      host: configService.getOrThrow("DB_HOST"),
      port: configService.getOrThrow("DB_PORT"),
      database: configService.getOrThrow("DB_NAME"),
      ssl: {
        ca: configService.getOrThrow("DATABASE_SSL_CA"),
        rejectUnauthorized: true,
      },
    });

    // Connection check at startup with helpful logs
    (async () => {
      try {
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
