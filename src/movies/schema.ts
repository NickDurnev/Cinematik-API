import {
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { users } from "@/auth/schema";
import { timestamps } from "@/utils/columns";

export const categoryEnum = pgEnum("category", ["favorites", "watched"]);

export const movies = pgTable(
  "movies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").references(() => users.id),
    idb_id: integer("idb_id").notNull(),
    poster_path: varchar("poster_path", { length: 255 }),
    category: categoryEnum("category").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    vote_average: numeric("vote_average").$type<number>().notNull(),
    genres: jsonb("genres").$type<{ id: string; name: string }[]>().notNull(),
    release_date: varchar("release_date", { length: 10 }).notNull(),
    tagline: varchar("tagline", { length: 255 }),
    runtime: integer("runtime"),
    budget: integer("budget"),
    overview: text("overview").notNull(),
    ...timestamps,
  },
  t => {
    return {
      moviesUserCategoryIdx: index("movies_user_id_category_idx").on(
        t.user_id,
        t.category,
      ),
      moviesUserIdbIdUnique: uniqueIndex("movies_user_id_idb_id_unique").on(
        t.user_id,
        t.idb_id,
      ),
    };
  },
);

export type Movie = typeof movies.$inferSelect;
