import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

import { User } from "@/auth/schema";
import { TMDBService } from "@/common/services/tmdb.service";

import {
  CreateSessionDto,
  GetMatchesDto,
  PairRequestAction,
  ProposeFiltersDto,
  RecordSwipeDto,
  SendPairRequestDto,
  SwipeDirection,
} from "./dto";
import { PairsGateway } from "./pairs.gateway";
import { PairsRepository } from "./pairs.repository";
import {
  Pair,
  PairMatch,
  PairRequest,
  PairSession,
  SessionFilter,
} from "./schema";

@Injectable()
export class PairsService {
  private readonly logger = new Logger(PairsService.name);

  constructor(
    private readonly pairsRepository: PairsRepository,
    private readonly tmdbService: TMDBService,
    private readonly pairsGateway: PairsGateway,
  ) {}

  // ==================== Pair Requests ====================

  async sendPairRequest(
    user: User,
    dto: SendPairRequestDto,
  ): Promise<PairRequest> {
    if (!dto.username && !dto.email) {
      throw new BadRequestException(
        "Either username or email must be provided",
      );
    }

    // Find the requested user
    const requestedUser = await this.pairsRepository.findUserByUsernameOrEmail(
      dto.username,
      dto.email,
    );

    if (!requestedUser) {
      throw new NotFoundException("User not found");
    }

    // Check if trying to invite self
    if (requestedUser.id === user.id) {
      throw new BadRequestException("Cannot send pair request to yourself");
    }

    // Check if pair already exists
    const existingPair = await this.pairsRepository.findPair(
      user.id,
      requestedUser.id,
    );

    if (existingPair) {
      throw new BadRequestException("You are already paired with this user");
    }

    // Check if pending request already exists (in either direction)
    const existingRequest1 = await this.pairsRepository.findPendingRequest(
      user.id,
      requestedUser.id,
    );

    if (existingRequest1) {
      throw new BadRequestException(
        "You already have a pending request to this user",
      );
    }

    const existingRequest2 = await this.pairsRepository.findPendingRequest(
      requestedUser.id,
      user.id,
    );

    if (existingRequest2) {
      throw new BadRequestException(
        "This user has already sent you a pair request",
      );
    }

    // Create request with 7 days expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const request = await this.pairsRepository.createPairRequest(
      user.id,
      requestedUser.id,
      expiresAt,
    );

    // Emit real-time notification to requested user
    this.pairsGateway.notifyPairRequest(requestedUser.id, {
      ...request,
      requester: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
    });

    return request;
  }

  getPendingRequests(user: User): Promise<
    (PairRequest & {
      requester: Pick<User, "id" | "name" | "email" | "picture">;
    })[]
  > {
    return this.pairsRepository.getPendingRequestsForUser(user.id);
  }

  async respondToPairRequest(
    user: User,
    requestId: string,
    action: PairRequestAction,
  ): Promise<{ request: PairRequest; pair?: Pair }> {
    const request = await this.pairsRepository.findPairRequestById(requestId);

    if (!request) {
      throw new NotFoundException("Pair request not found");
    }

    // Verify the user is the requested user
    if (request.requested_id !== user.id) {
      throw new ForbiddenException(
        "You are not authorized to respond to this request",
      );
    }

    // Check if request is still pending
    if (request.status !== "pending") {
      throw new BadRequestException(
        "This request has already been responded to",
      );
    }

    // Check if request has expired
    if (new Date(request.expires_at) < new Date()) {
      throw new BadRequestException("This request has expired");
    }

    // Update request status
    const updatedRequest = await this.pairsRepository.updatePairRequestStatus(
      requestId,
      action === PairRequestAction.ACCEPT ? "accepted" : "rejected",
    );

    // If accepted, create the pair
    let pair: Pair | undefined;
    if (action === PairRequestAction.ACCEPT) {
      pair = await this.pairsRepository.createPair(
        request.requester_id,
        request.requested_id,
      );
    }

    // Emit real-time notification to requester
    this.pairsGateway.notifyPairRequestResponse(request.requester_id, {
      request: updatedRequest,
      pair,
      accepted: action === PairRequestAction.ACCEPT,
    });

    return { request: updatedRequest, pair };
  }

  // ==================== Pairs ====================

  getUserPairs(user: User): Promise<
    (Pair & {
      otherUser: Pick<User, "id" | "name" | "email" | "picture">;
    })[]
  > {
    return this.pairsRepository.getUserPairs(user.id);
  }

  async deletePair(user: User, pairId: string): Promise<Pair> {
    const pair = await this.pairsRepository.findPairById(pairId);

    if (!pair) {
      throw new NotFoundException("Pair not found");
    }

    // Verify user is part of this pair
    if (pair.user1_id !== user.id && pair.user2_id !== user.id) {
      throw new ForbiddenException("You are not part of this pair");
    }

    return this.pairsRepository.deletePair(pairId);
  }

  // ==================== Sessions ====================

  async createSession(
    user: User,
    pairId: string,
    dto: CreateSessionDto,
  ): Promise<PairSession> {
    const pair = await this.pairsRepository.findPairById(pairId);

    if (!pair) {
      throw new NotFoundException("Pair not found");
    }

    // Verify user is part of this pair
    if (pair.user1_id !== user.id && pair.user2_id !== user.id) {
      throw new ForbiddenException("You are not part of this pair");
    }

    // Check if there's already an active session
    const activeSession = await this.pairsRepository.findActiveSession(pairId);

    if (activeSession) {
      throw new BadRequestException(
        "There is already an active session for this pair",
      );
    }

    const session = await this.pairsRepository.createSession(
      pairId,
      user.id,
      dto.mediaType,
    );

    // Emit real-time notification (pair room + each member's user room so partner gets it even when not on pair page)
    this.pairsGateway.notifySessionCreated(pairId, session, [
      pair.user1_id,
      pair.user2_id,
    ]);

    return session;
  }

  async getActiveSession(
    user: User,
    pairId: string,
  ): Promise<
    | (PairSession & {
        filters?: SessionFilter | null;
      })
    | null
  > {
    const pair = await this.pairsRepository.findPairById(pairId);

    if (!pair) {
      throw new NotFoundException("Pair not found");
    }

    // Verify user is part of this pair
    if (pair.user1_id !== user.id && pair.user2_id !== user.id) {
      throw new ForbiddenException("You are not part of this pair");
    }

    const session = await this.pairsRepository.findActiveSession(pairId);

    if (!session) {
      return null;
    }

    // Get filters if they exist
    const filters = await this.pairsRepository.getSessionFilters(session.id);

    return { ...session, filters };
  }

  async proposeFilters(
    user: User,
    sessionId: string,
    dto: ProposeFiltersDto,
  ): Promise<{ session: PairSession; filters: SessionFilter }> {
    const session = await this.pairsRepository.findSessionById(sessionId);

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    const pair = await this.pairsRepository.findPairById(session.pair_id);

    if (!pair) {
      throw new NotFoundException("Pair not found");
    }

    // Verify user is part of this pair
    if (pair.user1_id !== user.id && pair.user2_id !== user.id) {
      throw new ForbiddenException("You are not part of this pair");
    }

    // Verify session is in filter_pending status
    if (session.status !== "filter_pending") {
      throw new BadRequestException(
        "Filters can only be proposed for sessions in filter_pending status",
      );
    }

    // Validate year range
    if (dto.yearMin && dto.yearMax && dto.yearMin > dto.yearMax) {
      throw new BadRequestException("yearMin cannot be greater than yearMax");
    }

    // Create or update filters
    const filters = await this.pairsRepository.createOrUpdateSessionFilters(
      sessionId,
      {
        yearMin: dto.yearMin,
        yearMax: dto.yearMax,
        genreIds: dto.genreIds,
      },
    );

    // Update session to mark filters as proposed
    const updatedSession = await this.pairsRepository.updateSessionStatus(
      sessionId,
      "filter_pending",
      {
        filters_proposed_at: new Date(),
      },
    );

    // Emit real-time notification
    this.pairsGateway.notifyFiltersProposed(session.pair_id, {
      session: updatedSession,
    });

    return { session: updatedSession, filters };
  }

  async acceptFilters(
    user: User,
    sessionId: string,
  ): Promise<{ session: PairSession; filters: SessionFilter }> {
    const session = await this.pairsRepository.findSessionById(sessionId);

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    const pair = await this.pairsRepository.findPairById(session.pair_id);

    if (!pair) {
      throw new NotFoundException("Pair not found");
    }

    // Verify user is part of this pair
    if (pair.user1_id !== user.id && pair.user2_id !== user.id) {
      throw new ForbiddenException("You are not part of this pair");
    }

    // Verify user is not the one who created the session
    if (session.created_by_user_id === user.id) {
      throw new BadRequestException(
        "You cannot accept filters for a session you created",
      );
    }

    // Verify session is in filter_pending status with proposed filters
    if (session.status !== "filter_pending" || !session.filters_proposed_at) {
      throw new BadRequestException(
        "Filters must be proposed before they can be accepted",
      );
    }

    // Get filters
    const filters = await this.pairsRepository.getSessionFilters(sessionId);

    if (!filters) {
      throw new NotFoundException("Filters not found");
    }

    // Update session to active
    const updatedSession = await this.pairsRepository.updateSessionStatus(
      sessionId,
      "active",
      {
        filters_accepted_at: new Date(),
      },
    );

    // Emit real-time notification
    this.pairsGateway.notifyFiltersAccepted(session.pair_id, {
      session: updatedSession,
    });

    return { session: updatedSession, filters };
  }

  async endSession(user: User, sessionId: string): Promise<PairSession> {
    const session = await this.pairsRepository.findSessionById(sessionId);

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    const pair = await this.pairsRepository.findPairById(session.pair_id);

    if (!pair) {
      throw new NotFoundException("Pair not found");
    }

    // Verify user is part of this pair
    if (pair.user1_id !== user.id && pair.user2_id !== user.id) {
      throw new ForbiddenException("You are not part of this pair");
    }

    // Verify session is not already completed
    if (session.status === "completed") {
      throw new BadRequestException("Session is already completed");
    }

    // Update session to completed
    const completedSession = await this.pairsRepository.updateSessionStatus(
      sessionId,
      "completed",
      {
        ended_at: new Date(),
      },
    );

    // Emit real-time notification
    this.pairsGateway.notifySessionEnded(session.pair_id, completedSession);

    return completedSession;
  }

  // ==================== Swiping ====================

  async getNextContent(
    user: User,
    sessionId: string,
  ): Promise<{
    id: number;
    title: string;
    posterPath: string | null;
    overview: string;
    voteAverage?: number;
    releaseDate?: string;
    firstAirDate?: string;
  } | null> {
    const session = await this.pairsRepository.findSessionById(sessionId);

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    const pair = await this.pairsRepository.findPairById(session.pair_id);

    if (!pair) {
      throw new NotFoundException("Pair not found");
    }

    // Verify user is part of this pair
    if (pair.user1_id !== user.id && pair.user2_id !== user.id) {
      throw new ForbiddenException("You are not part of this pair");
    }

    // Verify session is active
    if (session.status !== "active") {
      throw new BadRequestException(
        "Session must be active to get next content",
      );
    }

    // Get filters
    const filters = await this.pairsRepository.getSessionFilters(session.id);

    // Get already swiped TMDB IDs
    const swipedIds =
      await this.pairsRepository.getSwipedTmdbIdsForSession(sessionId);

    // Fetch content from TMDB
    const discoverFilters = {
      yearMin: filters?.year_min || undefined,
      yearMax: filters?.year_max || undefined,
      genreIds: filters?.genre_ids || undefined,
    };

    let content: {
      id: number;
      title?: string;
      name?: string;
      poster_path: string | null;
      overview: string;
      vote_average: number;
      release_date?: string;
      first_air_date?: string;
    } | null = null;

    if (session.media_type === "movie") {
      content = await this.tmdbService.discoverMovies(
        discoverFilters,
        swipedIds,
      );
    } else {
      content = await this.tmdbService.discoverTVShows(
        discoverFilters,
        swipedIds,
      );
    }

    if (!content) {
      return null;
    }

    // Format response
    return {
      id: content.id,
      title: session.media_type === "movie" ? content.title : content.name,
      posterPath: content.poster_path,
      overview: content.overview,
      voteAverage: content.vote_average,
      releaseDate:
        session.media_type === "movie" ? content.release_date : undefined,
      firstAirDate:
        session.media_type === "tv" ? content.first_air_date : undefined,
    };
  }

  async recordSwipe(
    user: User,
    sessionId: string,
    dto: RecordSwipeDto,
  ): Promise<{ matched: boolean; match?: PairMatch }> {
    const session = await this.pairsRepository.findSessionById(sessionId);

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    const pair = await this.pairsRepository.findPairById(session.pair_id);

    if (!pair) {
      throw new NotFoundException("Pair not found");
    }

    // Verify user is part of this pair
    if (pair.user1_id !== user.id && pair.user2_id !== user.id) {
      throw new ForbiddenException("You are not part of this pair");
    }

    // Verify session is active
    if (session.status !== "active") {
      throw new BadRequestException("Session must be active to record swipes");
    }

    // Record the swipe
    await this.pairsRepository.createSwipe(
      sessionId,
      user.id,
      dto.tmdbId,
      session.media_type,
      dto.direction,
    );

    // Emit real-time notification to partner
    this.pairsGateway.notifyPartnerSwiped(session.pair_id, user.id, {
      tmdbId: dto.tmdbId,
      direction: dto.direction,
      userId: user.id,
    });

    // If swipe is right, check for match
    if (dto.direction === SwipeDirection.RIGHT) {
      const oppositeSwipe = await this.pairsRepository.findOppositeUserSwipe(
        sessionId,
        dto.tmdbId,
        user.id,
      );

      // If opposite user also swiped right, create a match
      if (oppositeSwipe && oppositeSwipe.direction === "right") {
        // Fetch content details from TMDB to store in match
        let content: {
          title?: string;
          name?: string;
          poster_path: string | null;
          overview: string;
        } | null = null;

        if (session.media_type === "movie") {
          content = await this.tmdbService.discoverMovies(
            {},
            [], // Don't exclude any IDs since we're fetching a specific one
          );
        } else {
          content = await this.tmdbService.discoverTVShows({}, []);
        }

        // Create match
        const match = await this.pairsRepository.createMatch(
          pair.id,
          sessionId,
          dto.tmdbId,
          session.media_type,
          content?.title || content?.name || "Unknown",
          content?.poster_path || null,
          content?.overview || "",
        );

        // Emit real-time notification for match
        this.pairsGateway.notifyMatch(pair.id, match);

        return { matched: true, match };
      }
    }

    return { matched: false };
  }

  // ==================== Matches ====================

  async getMatches(
    user: User,
    pairId: string,
    dto: GetMatchesDto,
  ): Promise<PairMatch[]> {
    const pair = await this.pairsRepository.findPairById(pairId);

    if (!pair) {
      throw new NotFoundException("Pair not found");
    }

    // Verify user is part of this pair
    if (pair.user1_id !== user.id && pair.user2_id !== user.id) {
      throw new ForbiddenException("You are not part of this pair");
    }

    return this.pairsRepository.getMatches(pairId, {
      mediaType: dto.mediaType,
      markedWatched: dto.markedWatched,
    });
  }

  async markMatchAsWatched(
    user: User,
    matchId: string,
    watched: boolean,
  ): Promise<PairMatch> {
    const match = await this.pairsRepository.findMatchById(matchId);

    if (!match) {
      throw new NotFoundException("Match not found");
    }

    const pair = await this.pairsRepository.findPairById(match.pair_id);

    if (!pair) {
      throw new NotFoundException("Pair not found");
    }

    // Verify user is part of this pair
    if (pair.user1_id !== user.id && pair.user2_id !== user.id) {
      throw new ForbiddenException("You are not part of this pair");
    }

    const updatedMatch = await this.pairsRepository.updateMatchWatchedStatus(
      matchId,
      watched,
    );

    // Emit real-time notification
    this.pairsGateway.notifyMatchWatchedUpdate(match.pair_id, {
      matchId,
      markedWatched: watched,
    });

    return updatedMatch;
  }

  // ==================== Scheduled Jobs ====================

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldSwipes() {
    this.logger.log("Running scheduled cleanup of old swipes...");

    try {
      const deletedCount = await this.pairsRepository.deleteOldSwipes(30);
      this.logger.log(`Deleted ${deletedCount} swipes older than 30 days`);
    } catch (error) {
      this.logger.error("Failed to cleanup old swipes", error.stack);
    }
  }
}
