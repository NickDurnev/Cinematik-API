import { User } from "@/auth/schema";
import { Review } from "@/reviews/schema";

export type ReviewWithUser = Review & Pick<User, "name" | "picture">;

export type PageMetaData = {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

export type ResponseStatus = "success" | "error";

export enum ResponseCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
  // ...add more as needed
}

export interface ResponseWrapper<T> {
  data: T;
  code: ResponseCode;
  message: string;
  status: ResponseStatus;
  meta?: PageMetaData;
}

export type TokensData = {
  access_token: string;
  refresh_token: string;
  access_token_expires: number;
  refresh_token_expires: number;
};

export type UserData = {
  id: string;
  name: string;
  email: string;
  picture: string;
  is_left_review: boolean;
};

export type AuthData = {
  user: UserData;
  tokens: TokensData;
};
