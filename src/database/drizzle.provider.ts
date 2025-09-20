import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as userSchema from "@/auth/schema";
import { DATABASE_CONNECTION } from "./database.connection";

export const DrizzleProvider = {
  provide: DATABASE_CONNECTION,
  useFactory: (configService: ConfigService) => {
    const pool = new Pool({
      connectionString: configService.getOrThrow("DATABASE_URL"),
      ssl:
        configService.get("STAGE") === "prod"
          ? { rejectUnauthorized: false }
          : undefined,
    });
    return drizzle(pool, { schema: { ...userSchema } });
  },
  inject: [ConfigService],
};
