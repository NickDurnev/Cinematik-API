import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "@/utils/columns";

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  text: text("text").notNull().unique(),
  rating: varchar("rating", { length: 5 }).notNull().unique(),
  ...timestamps,
});
