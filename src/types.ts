import { User } from "@/auth/schema";
import { Review } from "@/reviews/schema";

export type ReviewWithUser = Review & Pick<User, "name" | "picture">;
