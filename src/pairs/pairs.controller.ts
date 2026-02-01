import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { GetUser } from "@/auth/get-user.decorator";
import { User } from "@/auth/schema";
import { ResponseCode, ResponseWrapper } from "@/types";
import { buildResponse } from "@/utils/response/response-wrapper";

import {
  CreateSessionDto,
  GetMatchesDto,
  PairRequestAction,
  ProposeFiltersDto,
  RecordSwipeDto,
  RespondPairRequestDto,
  SendPairRequestDto,
} from "./dto";
import { PairsService } from "./pairs.service";
import {
  Pair,
  PairMatch,
  PairRequest,
  PairSession,
  SessionFilter,
} from "./schema";

@ApiTags("Pairs")
@Controller("pairs")
@ApiBearerAuth()
@UseGuards(AuthGuard())
export class PairsController {
  private logger = new Logger(PairsController.name);

  constructor(private readonly pairsService: PairsService) {}

  // ==================== Pair Requests ====================

  @Post("requests")
  @ApiOperation({ summary: "Send a pair request to another user" })
  @ApiBody({ type: SendPairRequestDto })
  @ApiResponse({
    status: 201,
    description: "Pair request sent successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - validation error or duplicate request",
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  async sendPairRequest(
    @GetUser() user: User,
    @Body() dto: SendPairRequestDto,
  ): Promise<ResponseWrapper<PairRequest>> {
    this.logger.verbose(
      `User "${user.name}" sending pair request: ${JSON.stringify(dto)}`,
    );
    const data = await this.pairsService.sendPairRequest(user, dto);
    return buildResponse({
      data,
      code: ResponseCode.CREATED,
      message: "Pair request sent successfully",
    });
  }

  @Get("requests")
  @ApiOperation({ summary: "Get pending incoming pair requests" })
  @ApiResponse({
    status: 200,
    description: "Pending requests retrieved successfully",
  })
  async getPendingRequests(@GetUser() user: User): Promise<
    ResponseWrapper<
      (PairRequest & {
        requester: Pick<User, "id" | "name" | "email" | "picture">;
      })[]
    >
  > {
    const data = await this.pairsService.getPendingRequests(user);
    return buildResponse({ data });
  }

  @Patch("requests/:id")
  @ApiOperation({ summary: "Accept or reject a pair request" })
  @ApiParam({ name: "id", description: "Pair request ID" })
  @ApiBody({ type: RespondPairRequestDto })
  @ApiResponse({
    status: 200,
    description: "Request responded to successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - request already responded to or expired",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - not authorized to respond to this request",
  })
  @ApiResponse({
    status: 404,
    description: "Request not found",
  })
  async respondToPairRequest(
    @GetUser() user: User,
    @Param("id") requestId: string,
    @Body() dto: RespondPairRequestDto,
  ): Promise<ResponseWrapper<{ request: PairRequest; pair?: Pair }>> {
    this.logger.verbose(
      `User "${user.name}" responding to pair request ${requestId}: ${dto.action}`,
    );
    const data = await this.pairsService.respondToPairRequest(
      user,
      requestId,
      dto.action,
    );
    return buildResponse({
      data,
      message:
        dto.action === PairRequestAction.ACCEPT
          ? "Pair request accepted"
          : "Pair request rejected",
    });
  }

  // ==================== Pairs ====================

  @Get()
  @ApiOperation({ summary: "Get all user pairs" })
  @ApiResponse({
    status: 200,
    description: "Pairs retrieved successfully",
  })
  async getUserPairs(@GetUser() user: User): Promise<
    ResponseWrapper<
      (Pair & {
        otherUser: Pick<User, "id" | "name" | "email" | "picture">;
      })[]
    >
  > {
    const data = await this.pairsService.getUserPairs(user);
    return buildResponse({ data });
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remove a pair" })
  @ApiParam({ name: "id", description: "Pair ID" })
  @ApiResponse({
    status: 200,
    description: "Pair removed successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - not part of this pair",
  })
  @ApiResponse({
    status: 404,
    description: "Pair not found",
  })
  async deletePair(
    @GetUser() user: User,
    @Param("id") pairId: string,
  ): Promise<ResponseWrapper<Pair>> {
    this.logger.verbose(`User "${user.name}" deleting pair ${pairId}`);
    const data = await this.pairsService.deletePair(user, pairId);
    return buildResponse({
      data,
      message: "Pair removed successfully",
    });
  }

  // ==================== Sessions ====================

  @Post(":pairId/sessions")
  @ApiOperation({ summary: "Create a new swiping session" })
  @ApiParam({ name: "pairId", description: "Pair ID" })
  @ApiBody({ type: CreateSessionDto })
  @ApiResponse({
    status: 201,
    description: "Session created successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - active session already exists",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - not part of this pair",
  })
  @ApiResponse({
    status: 404,
    description: "Pair not found",
  })
  async createSession(
    @GetUser() user: User,
    @Param("pairId") pairId: string,
    @Body() dto: CreateSessionDto,
  ): Promise<ResponseWrapper<PairSession>> {
    this.logger.verbose(
      `User "${user.name}" creating session for pair ${pairId}`,
    );
    const data = await this.pairsService.createSession(user, pairId, dto);
    return buildResponse({
      data,
      code: ResponseCode.CREATED,
      message: "Session created successfully",
    });
  }

  @Get(":pairId/sessions/active")
  @ApiOperation({ summary: "Get active session for a pair" })
  @ApiParam({ name: "pairId", description: "Pair ID" })
  @ApiResponse({
    status: 200,
    description: "Active session retrieved successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - not part of this pair",
  })
  @ApiResponse({
    status: 404,
    description: "Pair not found",
  })
  async getActiveSession(
    @GetUser() user: User,
    @Param("pairId") pairId: string,
  ): Promise<
    ResponseWrapper<
      | (PairSession & {
          filters?: SessionFilter | null;
        })
      | null
    >
  > {
    const data = await this.pairsService.getActiveSession(user, pairId);
    return buildResponse({ data });
  }

  @Patch(":pairId/sessions/:sessionId/filters")
  @ApiOperation({ summary: "Propose or accept filters for a session" })
  @ApiParam({ name: "pairId", description: "Pair ID" })
  @ApiParam({ name: "sessionId", description: "Session ID" })
  @ApiBody({ type: ProposeFiltersDto })
  @ApiResponse({
    status: 200,
    description: "Filters proposed successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - invalid filters or session status",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - not part of this pair",
  })
  @ApiResponse({
    status: 404,
    description: "Session not found",
  })
  async proposeFilters(
    @GetUser() user: User,
    @Param("sessionId") sessionId: string,
    @Body() dto: ProposeFiltersDto,
  ): Promise<
    ResponseWrapper<{ session: PairSession; filters: SessionFilter }>
  > {
    this.logger.verbose(
      `User "${user.name}" proposing filters for session ${sessionId}`,
    );
    const data = await this.pairsService.proposeFilters(user, sessionId, dto);
    return buildResponse({
      data,
      message: "Filters proposed successfully",
    });
  }

  @Post(":pairId/sessions/:sessionId/filters/accept")
  @ApiOperation({ summary: "Accept proposed filters and start swiping" })
  @ApiParam({ name: "pairId", description: "Pair ID" })
  @ApiParam({ name: "sessionId", description: "Session ID" })
  @ApiResponse({
    status: 200,
    description: "Filters accepted, session is now active",
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - filters not proposed or invalid session status",
  })
  @ApiResponse({
    status: 403,
    description:
      "Forbidden - not part of this pair or cannot accept own filters",
  })
  @ApiResponse({
    status: 404,
    description: "Session not found",
  })
  async acceptFilters(
    @GetUser() user: User,
    @Param("sessionId") sessionId: string,
  ): Promise<
    ResponseWrapper<{ session: PairSession; filters: SessionFilter }>
  > {
    this.logger.verbose(
      `User "${user.name}" accepting filters for session ${sessionId}`,
    );
    const data = await this.pairsService.acceptFilters(user, sessionId);
    return buildResponse({
      data,
      message: "Filters accepted, session is now active",
    });
  }

  @Post(":pairId/sessions/:sessionId/end")
  @ApiOperation({ summary: "End a session manually" })
  @ApiParam({ name: "pairId", description: "Pair ID" })
  @ApiParam({ name: "sessionId", description: "Session ID" })
  @ApiResponse({
    status: 200,
    description: "Session ended successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - session already completed",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - not part of this pair",
  })
  @ApiResponse({
    status: 404,
    description: "Session not found",
  })
  async endSession(
    @GetUser() user: User,
    @Param("sessionId") sessionId: string,
  ): Promise<ResponseWrapper<PairSession>> {
    this.logger.verbose(`User "${user.name}" ending session ${sessionId}`);
    const data = await this.pairsService.endSession(user, sessionId);
    return buildResponse({
      data,
      message: "Session ended successfully",
    });
  }

  // ==================== Swiping ====================

  @Get("sessions/:sessionId/next")
  @ApiOperation({ summary: "Get next content to swipe on" })
  @ApiParam({ name: "sessionId", description: "Session ID" })
  @ApiResponse({
    status: 200,
    description: "Next content retrieved successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - session not active",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - not part of this pair",
  })
  @ApiResponse({
    status: 404,
    description: "Session not found",
  })
  async getNextContent(
    @GetUser() user: User,
    @Param("sessionId") sessionId: string,
  ): Promise<
    ResponseWrapper<{
      id: number;
      title: string;
      posterPath: string | null;
      overview: string;
      voteAverage?: number;
      releaseDate?: string;
      firstAirDate?: string;
    } | null>
  > {
    const data = await this.pairsService.getNextContent(user, sessionId);
    return buildResponse({ data });
  }

  @Post("sessions/:sessionId/swipe")
  @ApiOperation({ summary: "Record a swipe" })
  @ApiParam({ name: "sessionId", description: "Session ID" })
  @ApiBody({ type: RecordSwipeDto })
  @ApiResponse({
    status: 200,
    description: "Swipe recorded successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - session not active",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - not part of this pair",
  })
  @ApiResponse({
    status: 404,
    description: "Session not found",
  })
  async recordSwipe(
    @GetUser() user: User,
    @Param("sessionId") sessionId: string,
    @Body() dto: RecordSwipeDto,
  ): Promise<ResponseWrapper<{ matched: boolean; match?: PairMatch }>> {
    this.logger.verbose(
      `User "${user.name}" swiping ${dto.direction} on ${dto.tmdbId}`,
    );
    const data = await this.pairsService.recordSwipe(user, sessionId, dto);
    return buildResponse({
      data,
      message: data.matched ? "It's a match!" : "Swipe recorded",
    });
  }

  // ==================== Matches ====================

  @Get(":pairId/matches")
  @ApiOperation({ summary: "Get all matches for a pair" })
  @ApiParam({ name: "pairId", description: "Pair ID" })
  @ApiQuery({
    name: "mediaType",
    required: false,
    enum: ["movie", "tv"],
    description: "Filter by media type",
  })
  @ApiQuery({
    name: "markedWatched",
    required: false,
    type: Boolean,
    description: "Filter by watched status",
  })
  @ApiResponse({
    status: 200,
    description: "Matches retrieved successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - not part of this pair",
  })
  @ApiResponse({
    status: 404,
    description: "Pair not found",
  })
  async getMatches(
    @GetUser() user: User,
    @Param("pairId") pairId: string,
    @Query() dto: GetMatchesDto,
  ): Promise<ResponseWrapper<PairMatch[]>> {
    const data = await this.pairsService.getMatches(user, pairId, dto);
    return buildResponse({ data });
  }

  @Patch(":pairId/matches/:matchId/watched")
  @ApiOperation({ summary: "Mark a match as watched or unwatched" })
  @ApiParam({ name: "pairId", description: "Pair ID" })
  @ApiParam({ name: "matchId", description: "Match ID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        watched: { type: "boolean" },
      },
      required: ["watched"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "Match updated successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - not part of this pair",
  })
  @ApiResponse({
    status: 404,
    description: "Match not found",
  })
  async markMatchAsWatched(
    @GetUser() user: User,
    @Param("matchId") matchId: string,
    @Body("watched") watched: boolean,
  ): Promise<ResponseWrapper<PairMatch>> {
    this.logger.verbose(
      `User "${user.name}" marking match ${matchId} as ${watched ? "watched" : "unwatched"}`,
    );
    const data = await this.pairsService.markMatchAsWatched(
      user,
      matchId,
      watched,
    );
    return buildResponse({
      data,
      message: `Match marked as ${watched ? "watched" : "unwatched"}`,
    });
  }
}
