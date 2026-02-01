import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { users } from "@/auth/schema";
import { timestamps } from "@/utils/columns";

// Enums
export const pairRequestStatusEnum = pgEnum("pair_request_status", [
  "pending",
  "accepted",
  "rejected",
]);

export const mediaTypeEnum = pgEnum("media_type", ["movie", "tv"]);

export const sessionStatusEnum = pgEnum("session_status", [
  "filter_pending",
  "active",
  "completed",
]);

export const swipeDirectionEnum = pgEnum("swipe_direction", ["left", "right"]);

// Tables
export const pairRequests = pgTable(
  "pair_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requester_id: uuid("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requested_id: uuid("requested_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: pairRequestStatusEnum("status").notNull().default("pending"),
    expires_at: timestamp("expires_at").notNull(),
    ...timestamps,
  },
  t => ({
    requestedStatusIdx: index("pair_requests_requested_status_idx").on(
      t.requested_id,
      t.status,
    ),
    requesterIdx: index("pair_requests_requester_idx").on(t.requester_id),
  }),
);

export const pairs = pgTable(
  "pairs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user1_id: uuid("user1_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    user2_id: uuid("user2_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  t => ({
    user1Idx: index("pairs_user1_idx").on(t.user1_id),
    user2Idx: index("pairs_user2_idx").on(t.user2_id),
    uniquePairIdx: uniqueIndex("pairs_unique_idx").on(t.user1_id, t.user2_id),
  }),
);

export const pairSessions = pgTable(
  "pair_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pair_id: uuid("pair_id")
      .notNull()
      .references(() => pairs.id, { onDelete: "cascade" }),
    created_by_user_id: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    media_type: mediaTypeEnum("media_type").notNull(),
    status: sessionStatusEnum("status").notNull().default("filter_pending"),
    filters_proposed_at: timestamp("filters_proposed_at"),
    filters_accepted_at: timestamp("filters_accepted_at"),
    ended_at: timestamp("ended_at"),
    ...timestamps,
  },
  t => ({
    pairStatusIdx: index("pair_sessions_pair_status_idx").on(
      t.pair_id,
      t.status,
    ),
  }),
);

export const sessionFilters = pgTable("session_filters", {
  id: uuid("id").primaryKey().defaultRandom(),
  session_id: uuid("session_id")
    .notNull()
    .references(() => pairSessions.id, { onDelete: "cascade" })
    .unique(),
  year_min: integer("year_min"),
  year_max: integer("year_max"),
  genre_ids: integer("genre_ids").array(),
  ...timestamps,
});

export const swipes = pgTable(
  "swipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    session_id: uuid("session_id")
      .notNull()
      .references(() => pairSessions.id, { onDelete: "cascade" }),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tmdb_id: integer("tmdb_id").notNull(),
    media_type: mediaTypeEnum("media_type").notNull(),
    direction: swipeDirectionEnum("direction").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  t => ({
    sessionTmdbUserIdx: index("swipes_session_tmdb_user_idx").on(
      t.session_id,
      t.tmdb_id,
      t.user_id,
    ),
    createdAtIdx: index("swipes_created_at_idx").on(t.created_at),
  }),
);

export const pairMatches = pgTable(
  "pair_matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pair_id: uuid("pair_id")
      .notNull()
      .references(() => pairs.id, { onDelete: "cascade" }),
    session_id: uuid("session_id")
      .notNull()
      .references(() => pairSessions.id, { onDelete: "cascade" }),
    tmdb_id: integer("tmdb_id").notNull(),
    media_type: mediaTypeEnum("media_type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    poster_path: varchar("poster_path", { length: 255 }),
    overview: varchar("overview", { length: 1000 }),
    matched_at: timestamp("matched_at").defaultNow().notNull(),
    marked_watched: boolean("marked_watched").default(false).notNull(),
  },
  t => ({
    pairMediaWatchedIdx: index("pair_matches_pair_media_watched_idx").on(
      t.pair_id,
      t.media_type,
      t.marked_watched,
    ),
  }),
);

// Relations
export const pairRequestRelations = relations(pairRequests, ({ one }) => ({
  requester: one(users, {
    fields: [pairRequests.requester_id],
    references: [users.id],
    relationName: "requester",
  }),
  requested: one(users, {
    fields: [pairRequests.requested_id],
    references: [users.id],
    relationName: "requested",
  }),
}));

export const pairRelations = relations(pairs, ({ one, many }) => ({
  user1: one(users, {
    fields: [pairs.user1_id],
    references: [users.id],
    relationName: "user1",
  }),
  user2: one(users, {
    fields: [pairs.user2_id],
    references: [users.id],
    relationName: "user2",
  }),
  sessions: many(pairSessions),
  matches: many(pairMatches),
}));

export const pairSessionRelations = relations(
  pairSessions,
  ({ one, many }) => ({
    pair: one(pairs, {
      fields: [pairSessions.pair_id],
      references: [pairs.id],
    }),
    createdBy: one(users, {
      fields: [pairSessions.created_by_user_id],
      references: [users.id],
    }),
    filters: one(sessionFilters, {
      fields: [pairSessions.id],
      references: [sessionFilters.session_id],
    }),
    swipes: many(swipes),
    matches: many(pairMatches),
  }),
);

export const sessionFilterRelations = relations(sessionFilters, ({ one }) => ({
  session: one(pairSessions, {
    fields: [sessionFilters.session_id],
    references: [pairSessions.id],
  }),
}));

export const swipeRelations = relations(swipes, ({ one }) => ({
  session: one(pairSessions, {
    fields: [swipes.session_id],
    references: [pairSessions.id],
  }),
  user: one(users, {
    fields: [swipes.user_id],
    references: [users.id],
  }),
}));

export const pairMatchRelations = relations(pairMatches, ({ one }) => ({
  pair: one(pairs, {
    fields: [pairMatches.pair_id],
    references: [pairs.id],
  }),
  session: one(pairSessions, {
    fields: [pairMatches.session_id],
    references: [pairSessions.id],
  }),
}));

// Type exports
export type PairRequest = typeof pairRequests.$inferSelect;
export type Pair = typeof pairs.$inferSelect;
export type PairSession = typeof pairSessions.$inferSelect;
export type SessionFilter = typeof sessionFilters.$inferSelect;
export type Swipe = typeof swipes.$inferSelect;
export type PairMatch = typeof pairMatches.$inferSelect;
