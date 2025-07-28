import { z } from "zod";

export const configValidationSchema = z.object({
  PORT: z.coerce.number().default(8080),
  STAGE: z.string(),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  RESEND_API_KEY: z.string(),
  CLIENT_APP_BASE_URL: z.string(),
});
