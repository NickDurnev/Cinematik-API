import { pgTable, foreignKey, unique, uuid, text, varchar, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const reviews = pgTable("reviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	text: text().notNull(),
	rating: varchar({ length: 5 }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	userId: uuid("user_id"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reviews_user_id_users_id_fk"
		}),
	unique("reviews_text_unique").on(table.text),
	unique("reviews_rating_unique").on(table.rating),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 32 }).notNull(),
	picture: text().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_name_unique").on(table.name),
	unique("users_email_unique").on(table.email),
]);
