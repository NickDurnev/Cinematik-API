import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

import { User, users } from "@/auth/schema";
import { DATABASE_CONNECTION } from "@/database/database.connection";
import { PageMetaData, ReviewWithUser } from "@/types";

import { CreateReviewDto, GetReviewsDto, UpdateReviewDto } from "./dto";
import { Review, reviews } from "./schema";

@Injectable()
class ReviewsRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly database: NodePgDatabase,
  ) {}

  private logger = new Logger("ReviewRepository");

  async getReviews(
    getDto: GetReviewsDto,
    user: User | null,
  ): Promise<{ data: ReviewWithUser[]; meta: PageMetaData }> {
    console.log('🚀 ~ ReviewsRepository ~ user:', user)
    const { page } = getDto;
    const pageSize = 10;
    const pageNumber = parseInt(page, 10) || 1;
    const offsetValue = (pageNumber - 1) * pageSize;

    try {
      let userReview: ReviewWithUser | null = null;
      let reviewsList: ReviewWithUser[] = [];
      let total = 0;

      // 1. If user, fetch their review
      if (user) {
        const [foundUserReview] = await this.database
          .select({
            id: reviews.id,
            user_id: reviews.user_id,
            text: reviews.text,
            rating: reviews.rating,
            created_at: reviews.created_at,
            updated_at: reviews.updated_at,
            name: users.name,
            picture: users.picture,
          })
          .from(reviews)
          .innerJoin(users, eq(reviews.user_id, users.id))
          .where(eq(reviews.user_id, user.id));
        userReview = foundUserReview || null;
      }

      // 2. Build query for other reviews (exclude user's review if user exists)
      const baseQuery = this.database
        .select({
          id: reviews.id,
          user_id: reviews.user_id,
          text: reviews.text,
          rating: reviews.rating,
          created_at: reviews.created_at,
          updated_at: reviews.updated_at,
          name: users.name,
          picture: users.picture,
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.user_id, users.id));

      // 3. Get total count (excluding user's review if user exists)
      const countQuery = this.database
        .select({ count: sql<number>`count(*)` })
        .from(reviews);
      let countResult;
      if (user) {
        countResult = await countQuery.where(sql`user_id <> ${user.id}`);
      } else {
        countResult = await countQuery;
      }
      total = Number(countResult[0].count);

      // 4. Fetch paginated reviews (excluding user's review if user exists)
      if (user && pageNumber === 1) {
        reviewsList = await baseQuery
          .where(sql`user_id <> ${user.id}`)
          .limit(pageSize - 1)
          .offset(0);
      } else if (user) {
        reviewsList = await baseQuery
          .where(sql`user_id <> ${user.id}`)
          .limit(pageSize)
          .offset(offsetValue - 1 >= 0 ? offsetValue - 1 : 0);
      } else {
        reviewsList = await baseQuery
          .limit(pageSize)
          .offset(offsetValue);
      }

      // 5. If userReview exists and page 1, prepend it
      let finalReviews: ReviewWithUser[] = [];
      if (userReview && pageNumber === 1) {
        finalReviews = [userReview, ...reviewsList];
        total += 1;
      } else {
        finalReviews = reviewsList;
      }

      const totalPages = Math.ceil(total / pageSize);

      return {
        data: finalReviews,
        meta: {
          total,
          page: pageNumber,
          limit: pageSize,
          total_pages: totalPages,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get reviews". GetDto: ${JSON.stringify(getDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async createReview(
    createReviewDto: CreateReviewDto,
    user: User,
  ): Promise<Review> {
    const { text, rating } = createReviewDto;

    try {
      const [newReview] = await this.database
        .insert(reviews)
        .values({
          text,
          rating,
          user_id: user.id,
        })
        .returning();

      return newReview;
    } catch (error) {
      this.logger.error(
        `Failed to create review for user "${user.name}". CreateDto: ${JSON.stringify(createReviewDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async updateReview(
    userId: string,
    updateReviewDto: UpdateReviewDto,
  ): Promise<Review> {
    const { text, rating } = updateReviewDto;

    try {
      const [updatedReview] = await this.database
        .update(reviews)
        .set({
          ...(text && { text }),
          ...(rating && { rating }),
        })
        .where(eq(reviews.user_id, userId))
        .returning();

      if (!updatedReview) {
        throw new Error("Review not found");
      }

      return updatedReview;
    } catch (error) {
      this.logger.error(
        `Failed to update review. UpdateDto: ${JSON.stringify(updateReviewDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async deleteReview(userId: string): Promise<Review> {
    try {
      const [deletedReview] = await this.database
        .delete(reviews)
        .where(eq(reviews.user_id, userId))
        .returning();

      return deletedReview;
    } catch (error) {
      this.logger.error("Failed to delete review", error.stack);
      throw new InternalServerErrorException();
    }
  }

  async getUserReviews(userId: string): Promise<Review> {
    try {
      const userReviews = await this.database
        .select()
        .from(reviews)
        .where(eq(reviews.user_id, userId));

      return userReviews[0] || null;
    } catch (error) {
      this.logger.error(`Failed to get user reviews ${userId}`, error.stack);
      throw new InternalServerErrorException();
    }
  }
}

export default ReviewsRepository;
