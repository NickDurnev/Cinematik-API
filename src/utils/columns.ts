import { timestamp } from "drizzle-orm/pg-core";

export const timestamps = {
  updated_at: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  created_at: timestamp("created_at").defaultNow().notNull(),
};
