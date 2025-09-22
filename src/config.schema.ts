import { z } from "zod";

export const configValidationSchema = z.object({
  PORT: z.coerce.number().default(8080),
  STAGE: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number(),
  DB_NAME: z.string(),
  DATABASE_SSL_CA: z.string(),
  JWT_SECRET: z.string(),
  RESEND_API_KEY: z.string(),
  CLIENT_APP_BASE_URL: z.string(),
});
