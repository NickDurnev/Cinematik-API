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

export const ForgotPasswordBody = {
  schema: {
    type: "object",
    properties: {
      email: {
        type: "string",
        format: "email",
        description: "User email address",
        example: "user@example.com",
      },
    },
    required: ["email"],
  },
};

export const ResetPasswordBody = {
  schema: {
    type: "object",
    properties: {
      token: {
        type: "string",
        description: "Password reset token from email",
        example: "abc123def456...",
      },
      newPassword: {
        type: "string",
        description: "New password (must be strong)",
        example: "NewStrongPass123!",
        minLength: 8,
        maxLength: 32,
      },
    },
    required: ["token", "newPassword"],
  },
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

export const ForgotPasswordApiResponse = {
  status: 200,
  description: "Password reset email sent",
  schema: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      message: { type: "string" },
      data: { type: "object" },
      code: { type: "string" },
    },
  },
};

export const ResetPasswordApiResponse = {
  status: 200,
  description: "Password reset successfully",
  schema: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      message: { type: "string" },
      data: { type: "object" },
      code: { type: "string" },
    },
  },
};
