import { CreateReviewDto } from "./dto";

const ReviewDataSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    user_id: { type: "string", format: "uuid" },
    text: { type: "string" },
    rating: { type: "string" },
    created_at: { type: "string", format: "date-time" },
    updated_at: { type: "string", format: "date-time" },
  },
};

export const CreateReviewApiBody = {
  type: CreateReviewDto,
  description: "Review data to create",
};

export const UpdateReviewApiBody = {
  type: CreateReviewDto,
  description: "Review data to update",
};

export const CreateReviewApiResponse = {
  status: 201,
  description: "Review created successfully",
  schema: {
    type: "object",
    properties: {
      data: ReviewDataSchema,
      code: { type: "string" },
      message: { type: "string" },
    },
  },
};

export const UpdateReviewApiResponse = {
  status: 200,
  description: "Review updated successfully",
  schema: {
    type: "object",
    properties: {
      data: ReviewDataSchema,
      code: { type: "string" },
      message: { type: "string" },
    },
  },
};

export const GetReviewsApiResponse = {
  status: 200,
  description: "Reviews retrieved successfully",
  schema: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: ReviewDataSchema,
      },
      code: { type: "string" },
      message: { type: "string" },
      meta: {
        type: "object",
        properties: {
          page: { type: "number" },
          limit: { type: "number" },
          total: { type: "number" },
          total_pages: { type: "number" },
        },
      },
    },
  },
};
