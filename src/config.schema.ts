import { z } from "zod";

export const configValidationSchema = z.object({
  PORT: z.coerce.number().default(3000),
  STAGE: z.string(),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
});
