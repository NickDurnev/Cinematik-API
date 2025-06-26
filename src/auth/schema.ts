import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "@/utils/columns";

export const users = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 32 }).notNull(),
  picture: text("picture").notNull(),
  refreshToken: text("refresh_token").nullable(),
  ...timestamps,
});
