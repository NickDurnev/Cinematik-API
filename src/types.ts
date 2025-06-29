import { User } from "@/auth/schema";
import { Review } from "@/reviews/schema";

export type ReviewWithUser = Review & Pick<User, "name" | "picture">;

export type TokensData = {
  access_token: string;
  refresh_token: string;
  access_token_expires: number;
  refresh_token_expires: number;
};
