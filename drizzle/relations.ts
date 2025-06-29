import { relations } from "drizzle-orm/relations";
import { users, reviews } from "./schema";

export const reviewsRelations = relations(reviews, ({one}) => ({
	user: one(users, {
		fields: [reviews.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	reviews: many(reviews),
}));