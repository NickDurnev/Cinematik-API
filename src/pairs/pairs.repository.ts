import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { and, eq, or, sql } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

import { User, users } from "@/auth/schema";
import { DATABASE_CONNECTION } from "@/database/database.connection";

import {
  Pair,
  PairMatch,
  PairRequest,
  PairSession,
  pairMatches,
  pairRequests,
  pairSessions,
  pairs,
  SessionFilter,
  Swipe,
  sessionFilters,
  swipes,
} from "./schema";

@Injectable()
export class PairsRepository {
  private logger = new Logger(PairsRepository.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly database: NodePgDatabase,
  ) {}

  // ==================== Pair Requests ====================

  async createPairRequest(
    requesterId: string,
    requestedId: string,
    expiresAt: Date,
  ): Promise<PairRequest> {
    try {
      const [request] = await this.database
        .insert(pairRequests)
        .values({
          requester_id: requesterId,
          requested_id: requestedId,
          expires_at: expiresAt,
        })
        .returning();

      return request;
    } catch (error) {
      this.logger.error("Failed to create pair request", error.stack);
      throw new InternalServerErrorException();
    }
  }

  async findPendingRequest(
    requesterId: string,
    requestedId: string,
  ): Promise<PairRequest | null> {
    try {
      const [request] = await this.database
        .select()
        .from(pairRequests)
        .where(
          and(
            eq(pairRequests.requester_id, requesterId),
            eq(pairRequests.requested_id, requestedId),
            eq(pairRequests.status, "pending"),
          ),
        )
        .limit(1);

      return request || null;
    } catch (error) {
      this.logger.error("Failed to find pending request", error.stack);
      throw new InternalServerErrorException();
    }
  }

  async getPendingRequestsForUser(userId: string): Promise<
    (PairRequest & {
      requester: Pick<User, "id" | "name" | "email" | "picture">;
    })[]
  > {
    try {
      const requests = await this.database
        .select({
          id: pairRequests.id,
          requester_id: pairRequests.requester_id,
          requested_id: pairRequests.requested_id,
          status: pairRequests.status,
          expires_at: pairRequests.expires_at,
          created_at: pairRequests.created_at,
          updated_at: pairRequests.updated_at,
          requester: {
            id: users.id,
            name: users.name,
            email: users.email,
            picture: users.picture,
          },
        })
        .from(pairRequests)
        .innerJoin(users, eq(pairRequests.requester_id, users.id))
        .where(
          and(
            eq(pairRequests.requested_id, userId),
            eq(pairRequests.status, "pending"),
          ),
        );

      return requests;
    } catch (error) {
      this.logger.error("Failed to get pending requests", error.stack);
      throw new InternalServerErrorException();
    }
  }

  async findPairRequestById(requestId: string): Promise<PairRequest | null> {
    try {
      const [request] = await this.database
        .select()
        .from(pairRequests)
        .where(eq(pairRequests.id, requestId))
        .limit(1);

      return request || null;
    } catch (error) {
      this.logger.error("Failed to find pair request by id", error.stack);
      throw new InternalServerErrorException();
    }
  }

  async updatePairRequestStatus(
    requestId: string,
    status: "accepted" | "rejected",
  ): Promise<PairRequest> {
    try {
      const [updated] = await this.database
        .update(pairRequests)
        .set({ status })
        .where(eq(pairRequests.id, requestId))
        .returning();

      return updated;
    } catch (error) {
      this.logger.error("Failed to update pair request status", error.stack);
      throw new InternalServerErrorException();
    }
  }

  // ==================== Pairs ====================

  async createPair(user1Id: string, user2Id: string): Promise<Pair> {
    try {
      // Always store with smaller UUID first to ensure uniqueness
      const [userId1, userId2] =
        user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

      const [pair] = await this.database
        .insert(pairs)
        .values({
          user1_id: userId1,
          user2_id: userId2,
        })
        .returning();

      return pair;
    } catch (error) {
      this.logger.error("Failed to create pair", error.stack);
      throw new InternalServerErrorException();
    }
  }

  async findPair(user1Id: string, user2Id: string): Promise<Pair | null> {
    try {
      const [pair] = await this.database
        .select()
        .from(pairs)
        .where(
          or(
            and(eq(pairs.user1_id, user1Id), eq(pairs.user2_id, user2Id)),
            and(eq(pairs.user1_id, user2Id), eq(pairs.user2_id, user1Id)),
          ),
        )
        .limit(1);

      return pair || null;
    } catch (error) {
      this.logger.error("Failed to find pair", error.stack);
      throw new InternalServerErrorException();
    }
  }

  async findPairById(pairId: string): Promise<Pair | null> {
    try {
      const [pair] = await this.database
        .select()
        .from(pairs)
        .where(eq(pairs.id, pairId))
        .limit(1);

      return pair || null;
    } catch (error) {
      this.logger.error("Failed to find pair by id", error.stack);
      throw new InternalServerErrorException();
    }
  }

  async getUserPairs(userId: string): Promise<
    (Pair & {
      otherUser: Pick<User, "id" | "name" | "email" | "picture">;
    })[]
  > {
    try {
      // Get pairs where user is user1
      const pairsAsUser1 = await this.database
        .select({
          id: pairs.id,
          user1_id: pairs.user1_id,
          user2_id: pairs.user2_id,
          created_at: pairs.created_at,
          otherUser: {
            id: users.id,
            name: users.name,
            email: users.email,
            picture: users.picture,
          },
        })
        .from(pairs)
        .innerJoin(users, eq(pairs.user2_id, users.id))
        .where(eq(pairs.user1_id, userId));

      // Get pairs where user is user2
      const pairsAsUser2 = await this.database
        .select({
          id: pairs.id,
          user1_id: pairs.user1_id,
          user2_id: pairs.user2_id,
          created_at: pairs.created_at,
          otherUser: {
            id: users.id,
            name: users.name,
            email: users.email,
            picture: users.picture,
          },
        })
        .from(pairs)
        .innerJoin(users, eq(pairs.user1_id, users.id))
        .where(eq(pairs.user2_id, userId));

      return [...pairsAsUser1, ...pairsAsUser2];
    } catch (error) {
      this.logger.error("Failed to get user pairs", error.stack);
      throw new InternalServerErrorException();
    }
  }

  async deletePair(pairId: string): Promise<Pair> {
    try {
      const [deleted] = await this.database
        .delete(pairs)
        .where(eq(pairs.id, pairId))
        .returning();

      return deleted;
    } catch (error) {
      this.logger.error("Failed to delete pair", error.stack);
      throw new InternalServerErrorException();
    }
  }

  // ==================== Sessions ====================

  async createSession(
    pairId: string,
    createdByUserId: string,
    mediaType: "movie" | "tv",
  ): Promise<PairSession> {
    try {
      const [session] = await this.database
        .insert(pairSessions)
        .values({
          pair_id: pairId,
          created_by_user_id: createdByUserId,
          media_type: mediaType,
        })
        .returning();

      return session;
    } catch (error) {
      this.logger.error("Failed to create session", error.stack);
      throw new InternalServerErrorException();
    }
  }

  async findActiveSession(pairId: string): Promise<PairSession | null> {
    try {
      const [session] = await this.database
        .select()
        .from(pairSessions)
        .where(
          and(
            eq(pairSessions.pair_id, pairId),
            or(
              eq(pairSessions.status, "filter_pending"),
              eq(pairSessions.status, "active"),
            ),
          ),
        )
        .limit(1);

      return session || null;
    } catch (error) {
      this.logger.error("Failed to find active session", error.stack);
      throw new InternalServerErrorException();
    }
  }

  async findSessionById(sessionId: string): Promise<PairSession | null> {
    try {
      const [session] = await this.database
        .select()
        .from(pairSessions)
        .where(eq(pairSessions.id, sessionId))
        .limit(1);

      return session || null;
    } catch (error) {
      this.logger.error("Failed to find session by id", error.stack);
      throw new InternalServerErrorException();
    }
  }

  async updateSessionStatus(
    sessionId: string,
    status: "filter_pending" | "active" | "completed",
    additionalFields?: {
      filters_proposed_at?: Date;
      filters_accepted_at?: Date;
      ended_at?: Date;
    },
  ): Promise<PairSession> {
    try {
      const [updated] = await this.database
        .update(pairSessions)
        .set({ status, ...additionalFields })
        .where(eq(pairSessions.id, sessionId))
        .returning();

      return updated;
    } catch (error) {
      this.logger.error("Failed to update session status", error.stack);
      throw new InternalServerErrorException();
    }
  }

  // ==================== Session Filters ====================

  async createOrUpdateSessionFilters(
    sessionId: string,
    filters: {
      yearMin?: number;
      yearMax?: number;
      genreIds?: number[];
    },
  ): Promise<SessionFilter> {
    try {
      // Try to insert, on conflict update
      const [filter] = await this.database
        .insert(sessionFilters)
        .values({
          session_id: sessionId,
          year_min: filters.yearMin,
          year_max: filters.yearMax,
          genre_ids: filters.genreIds,
        })
        .onConflictDoUpdate({
          target: sessionFilters.session_id,
          set: {
            year_min: filters.yearMin,
            year_max: filters.yearMax,
            genre_ids: filters.genreIds,
            updated_at: new Date(),
          },
        })
        .returning();

      return filter;
    } catch (error) {
      this.logger.error("Failed to create/update session filters", error.stack);
      throw new InternalServerErrorException();
    }
  }

  async getSessionFilters(sessionId: string): Promise<SessionFilter | null> {
    try {
      const [filter] = await this.database
        .select()
        .from(sessionFilters)
        .where(eq(sessionFilters.session_id, sessionId))
        .limit(1);

      return filter || null;
    } catch (error) {
      this.logger.error("Failed to get session filters", error.stack);
      throw new InternalServerErrorException();
    }
  }

  // ==================== Swipes ====================

  async createSwipe(
    sessionId: string,
    userId: string,
    tmdbId: number,
    mediaType: "movie" | "tv",
    direction: "left" | "right",
  ): Promise<Swipe> {
    try {
      const [swipe] = await this.database
        .insert(swipes)
        .values({
          session_id: sessionId,
          user_id: userId,
          tmdb_id: tmdbId,
          media_type: mediaType,
          direction,
        })
        .returning();

      return swipe;
    } catch (error) {
      this.logger.error("Failed to create swipe", error.stack);
      throw new InternalServerErrorException();
    }
  }

  async findOppositeUserSwipe(
    sessionId: string,
    tmdbId: number,
    excludeUserId: string,
  ): Promise<Swipe | null> {
    try {
      const [swipe] = await this.database
        .select()
        .from(swipes)
        .where(
          and(
            eq(swipes.session_id, sessionId),
            eq(swipes.tmdb_id, tmdbId),
            sql`${swipes.user_id} != ${excludeUserId}`,
          ),
        )
        .limit(1);

      return swipe || null;
    } catch (error) {
      this.logger.error("Failed to find opposite user swipe", error.stack);
      throw new InternalServerErrorException();
    }
  }

  async getSwipedTmdbIdsForSession(sessionId: string): Promise<number[]> {
    try {
      const result = await this.database
        .selectDistinct({ tmdb_id: swipes.tmdb_id })
        .from(swipes)
        .where(eq(swipes.session_id, sessionId));

      return result.map(r => r.tmdb_id);
    } catch (error) {
      this.logger.error("Failed to get swiped tmdb ids", error.stack);
      throw new InternalServerErrorException();
    }
  }

  async deleteOldSwipes(daysOld: number): Promise<number> {
    try {
      const result = await this.database
        .delete(swipes)
        .where(
          sql`${swipes.created_at} < NOW() - INTERVAL '${sql.raw(daysOld.toString())} days'`,
        );

      return result.rowCount || 0;
    } catch (error) {
      this.logger.error("Failed to delete old swipes", error.stack);
      throw new InternalServerErrorException();
    }
  }

  // ==================== Matches ====================

  async createMatch(
    pairId: string,
    sessionId: string,
    tmdbId: number,
    mediaType: "movie" | "tv",
    title: string,
    posterPath: string | null,
    overview: string,
  ): Promise<PairMatch> {
    try {
      const [match] = await this.database
        .insert(pairMatches)
        .values({
          pair_id: pairId,
          session_id: sessionId,
          tmdb_id: tmdbId,
          media_type: mediaType,
          title,
          poster_path: posterPath,
          overview,
        })
        .returning();

      return match;
    } catch (error) {
      this.logger.error("Failed to create match", error.stack);
      throw new InternalServerErrorException();
    }
  }

  async getMatches(
    pairId: string,
    filters?: {
      mediaType?: "movie" | "tv";
      markedWatched?: boolean;
    },
  ): Promise<PairMatch[]> {
    try {
      const conditions = [eq(pairMatches.pair_id, pairId)];

      if (filters?.mediaType) {
        conditions.push(eq(pairMatches.media_type, filters.mediaType));
      }

      if (filters?.markedWatched !== undefined) {
        conditions.push(eq(pairMatches.marked_watched, filters.markedWatched));
      }

      const matches = await this.database
        .select()
        .from(pairMatches)
        .where(and(...conditions))
        .orderBy(sql`${pairMatches.matched_at} DESC`);

      return matches;
    } catch (error) {
      this.logger.error("Failed to get matches", error.stack);
      throw new InternalServerErrorException();
    }
  }

  async findMatchById(matchId: string): Promise<PairMatch | null> {
    try {
      const [match] = await this.database
        .select()
        .from(pairMatches)
        .where(eq(pairMatches.id, matchId))
        .limit(1);

      return match || null;
    } catch (error) {
      this.logger.error("Failed to find match by id", error.stack);
      throw new InternalServerErrorException();
    }
  }

  async updateMatchWatchedStatus(
    matchId: string,
    markedWatched: boolean,
  ): Promise<PairMatch> {
    try {
      const [updated] = await this.database
        .update(pairMatches)
        .set({ marked_watched: markedWatched })
        .where(eq(pairMatches.id, matchId))
        .returning();

      return updated;
    } catch (error) {
      this.logger.error("Failed to update match watched status", error.stack);
      throw new InternalServerErrorException();
    }
  }

  async findUserByUsernameOrEmail(
    username?: string,
    email?: string,
  ): Promise<User | null> {
    try {
      const conditions = [];
      if (username) {
        conditions.push(eq(users.name, username));
      }
      if (email) {
        conditions.push(eq(users.email, email));
      }

      if (conditions.length === 0) {
        return null;
      }

      const [user] = await this.database
        .select()
        .from(users)
        .where(or(...conditions))
        .limit(1);

      return user || null;
    } catch (error) {
      this.logger.error(
        "Failed to find user by username or email",
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }
}
