import { CreateMovieDto, UpdateMovieDto } from "./dto";

const MovieDataSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    user_id: { type: "string", format: "uuid" },
    idb_id: { type: "integer" },
    poster_path: { type: "string", maxLength: 255 },
    category: { type: "string", enum: ["favorites", "watched"] },
    title: { type: "string", maxLength: 255 },
    vote_average: { type: "number" },
    genres: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
        },
      },
    },
    release_date: { type: "string", maxLength: 10 },
    tagline: { type: "string", maxLength: 255 },
    runtime: { type: "integer" },
    budget: { type: "integer" },
    overview: { type: "string" },
    created_at: { type: "string", format: "date-time" },
    updated_at: { type: "string", format: "date-time" },
  },
  required: [
    "id",
    "user_id",
    "idb_id",
    "category",
    "title",
    "vote_average",
    "genres",
    "release_date",
    "overview",
    "created_at",
    "updated_at",
  ],
};

export const CreateMovieApiBody = {
  type: CreateMovieDto,
  description: "Movie data to create",
};

export const UpdateMovieApiBody = {
  type: UpdateMovieDto,
  description: "Movie data to update",
};

export const CreateMovieApiResponse = {
  status: 201,
  description: "Movie created successfully",
  schema: {
    type: "object",
    properties: {
      data: MovieDataSchema,
      code: { type: "string" },
      message: { type: "string" },
    },
  },
};

export const UpdateMovieApiResponse = {
  status: 200,
  description: "Movie updated successfully",
  schema: {
    type: "object",
    properties: {
      data: MovieDataSchema,
      code: { type: "string" },
      message: { type: "string" },
    },
  },
};

export const GetMoviesApiResponse = {
  status: 200,
  description: "Movies retrieved successfully",
  schema: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: MovieDataSchema,
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

export const GetMovieIdsApiResponse = {
  status: 200,
  description: "User's movie IDs retrieved successfully",
  schema: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: { type: "integer" },
      },
      code: { type: "string" },
      message: { type: "string" },
    },
  },
};
