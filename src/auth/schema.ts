import { relations } from "drizzle-orm";
import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { reviews } from "@/reviews/schema";
import { timestamps } from "@/utils/columns";

export const users = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 32 }).notNull(),
  picture: text("picture").notNull(),
  ...timestamps,
});

export const reviewRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.user_id], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
