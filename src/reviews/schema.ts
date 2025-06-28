import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "@/auth/schema";
import { timestamps } from "@/utils/columns";

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => users.id),
  text: text("text").notNull().unique(),
  rating: varchar("rating", { length: 5 }).notNull().unique(),
  ...timestamps,
});

export type Review = typeof reviews.$inferSelect;
