import { ApiResponseOptions } from "@nestjs/swagger";

export const SendPairRequestApiResponse: ApiResponseOptions = {
  status: 201,
  description: "Pair request sent successfully",
  schema: {
    example: {
      code: 201,
      message: "Pair request sent successfully",
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        requester_id: "550e8400-e29b-41d4-a716-446655440001",
        requested_id: "550e8400-e29b-41d4-a716-446655440002",
        status: "pending",
        expires_at: "2024-01-15T00:00:00.000Z",
        created_at: "2024-01-08T00:00:00.000Z",
        updated_at: "2024-01-08T00:00:00.000Z",
      },
    },
  },
};

export const GetPairsApiResponse: ApiResponseOptions = {
  status: 200,
  description: "Pairs retrieved successfully",
  schema: {
    example: {
      code: 200,
      message: "Success",
      data: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          user1_id: "550e8400-e29b-41d4-a716-446655440001",
          user2_id: "550e8400-e29b-41d4-a716-446655440002",
          created_at: "2024-01-08T00:00:00.000Z",
          otherUser: {
            id: "550e8400-e29b-41d4-a716-446655440002",
            name: "Jane Doe",
            email: "jane@example.com",
            picture: "https://example.com/avatar.jpg",
          },
        },
      ],
    },
  },
};

export const CreateSessionApiResponse: ApiResponseOptions = {
  status: 201,
  description: "Session created successfully",
  schema: {
    example: {
      code: 201,
      message: "Session created successfully",
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        pair_id: "550e8400-e29b-41d4-a716-446655440001",
        created_by_user_id: "550e8400-e29b-41d4-a716-446655440002",
        media_type: "movie",
        status: "filter_pending",
        filters_proposed_at: null,
        filters_accepted_at: null,
        ended_at: null,
        created_at: "2024-01-08T00:00:00.000Z",
        updated_at: "2024-01-08T00:00:00.000Z",
      },
    },
  },
};

export const GetMatchesApiResponse: ApiResponseOptions = {
  status: 200,
  description: "Matches retrieved successfully",
  schema: {
    example: {
      code: 200,
      message: "Success",
      data: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          pair_id: "550e8400-e29b-41d4-a716-446655440001",
          session_id: "550e8400-e29b-41d4-a716-446655440002",
          tmdb_id: 550,
          media_type: "movie",
          title: "Fight Club",
          poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
          overview: "A ticking-time-bomb insomniac...",
          matched_at: "2024-01-08T00:00:00.000Z",
          marked_watched: false,
        },
      ],
    },
  },
};
