import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as userSchema from "@/auth/schema";

export const DrizzleProvider = {
  provide: "DRIZZLE",
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
