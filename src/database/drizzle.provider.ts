import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema"; // Your Drizzle schema

export const DrizzleProvider = {
  provide: "DRIZZLE",
  useFactory: (configService: ConfigService) => {
    const pool = new Pool({
      host: configService.get("DB_HOST"),
      port: configService.get("DB_PORT"),
      user: configService.get("DB_USERNAME"),
      password: configService.get("DB_PASSWORD"),
      database: configService.get("DB_DATABASE"),
      ssl:
        configService.get("STAGE") === "prod"
          ? { rejectUnauthorized: false }
          : undefined,
    });
    return drizzle(pool, { schema: {} });
  },
  inject: [ConfigService],
};
