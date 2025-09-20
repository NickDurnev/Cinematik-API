import { relations } from "drizzle-orm";
import { pgTable, text, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { reviews } from "@/reviews/schema";
import { timestamps } from "@/utils/columns";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }),
  picture: text("picture"),
  ...timestamps,
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expires_at: timestamp("expires_at").notNull(),
  used: text("used").default("false"),
  ...timestamps,
});

export const reviewRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.user_id], references: [users.id] }),
}));

export const passwordResetTokenRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, { fields: [passwordResetTokens.user_id], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
