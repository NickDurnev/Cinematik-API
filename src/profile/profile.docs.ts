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
