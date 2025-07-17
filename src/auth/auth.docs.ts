// src/auth/auth.docs.ts
import {
  AuthCredentialsDto,
  AuthSignInDto,
  AuthSocialDto,
} from "./dto/auth-credentials.dto";

export const TokensDataSchema = {
  type: "object",
  properties: {
    access_token: { type: "string" },
    access_token_expires: { type: "string" },
    refresh_token: { type: "string" },
    refresh_token_expires: { type: "string" },
  },
};

export const UserDataSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    email: { type: "string" },
    picture: { type: "string" },
    is_left_review: { type: "boolean" },
  },
};

export const SignUpApiBody = {
  type: AuthCredentialsDto,
  description: "User registration data",
};

export const SignInApiBody = {
  type: AuthSignInDto,
  description: "User login credentials",
};

export const SocialLoginApiBody = {
  type: AuthSocialDto,
  description: "Social login data",
};

export const RefreshTokenApiBody = {
  schema: {
    type: "object",
    properties: {
      refreshToken: {
        type: "string",
        description: "Refresh token to generate new access token",
      },
    },
    required: ["refresh_token"],
  },
  description: "Refresh token data",
};

export const RefreshTokenApiResponse = {
  status: 200,
  description: "Access token refreshed successfully",
  schema: {
    type: "object",
    properties: {
      data: {
        type: "object",
        properties: {
          access_token: { type: "string" },
          access_token_expires: { type: "string" },
        },
      },
      code: { type: "string" },
      message: { type: "string" },
    },
  },
};

export const SignInApiResponse = {
  status: 200,
  description: "User signed in successfully",
  schema: {
    type: "object",
    properties: {
      data: {
        type: "object",
        properties: {
          user: UserDataSchema,
          tokens: TokensDataSchema,
        },
      },
      code: { type: "string" },
      message: { type: "string" },
    },
  },
};

export const SignUpApiResponse = {
  status: 201,
  description: "User signed up successfully",
  schema: {
    type: "object",
    properties: {
      data: {
        type: "object",
        properties: {
          user: UserDataSchema,
          tokens: TokensDataSchema,
        },
      },
      code: { type: "string" },
      message: { type: "string" },
    },
  },
};

// ...add other shared docs objects as needed
