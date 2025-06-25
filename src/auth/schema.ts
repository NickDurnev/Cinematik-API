import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "@/utils/columns";

export const users = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  picture: text("picture").notNull(),
  ...timestamps,
});
