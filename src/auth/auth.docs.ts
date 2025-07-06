// src/auth/auth.docs.ts

import {
  AuthCredentialsDto,
  AuthSignInDto,
  AuthSocialDto,
} from "./dto/auth-credentials.dto";

// Common response schema for tokens
export const TokensDataSchema = {
  type: "object",
  properties: {
    access_token: { type: "string" },
    access_token_expires: { type: "string" },
    refresh_token: { type: "string" },
    refresh_token_expires: { type: "string" },
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
    required: ["refreshToken"],
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

export const TokensApiResponse = {
  status: 200,
  description: "User signed in successfully",
  schema: {
    type: "object",
    properties: {
      data: TokensDataSchema,
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
      data: TokensDataSchema,
      code: { type: "string" },
      message: { type: "string" },
    },
  },
};

// ...add other shared docs objects as needed
