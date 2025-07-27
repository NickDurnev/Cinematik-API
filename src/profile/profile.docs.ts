import { UserDataSchema } from "@/auth/auth.docs";

import { UpdateProfileDto } from "./dto";

export const UpdateProfileApiBody = {
  type: UpdateProfileDto,
  description: "Profile update data",
};

export const GetProfileApiResponse = {
  status: 200,
  description: "Profile retrieved successfully",
  schema: {
    type: "object",
    properties: {
      data: UserDataSchema,
      code: { type: "string" },
      message: { type: "string" },
    },
  },
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

export const UpdateProfileApiResponse = {
  status: 200,
  description: "Profile updated successfully",
  schema: {
    type: "object",
    properties: {
      data: UserDataSchema,
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
