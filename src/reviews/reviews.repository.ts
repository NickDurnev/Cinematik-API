import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

import { User, users } from "@/auth/schema";
import { DATABASE_CONNECTION } from "@/database/database.connection";
import { ReviewWithUser } from "@/types";

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
  ): Promise<ReviewWithUser[]> {
    const { page } = getDto;
    const pageSize = 10; // Number of reviews per page
    const pageNumber = parseInt(page, 10) || 1;
    const offsetValue = (pageNumber - 1) * pageSize;

    try {
      const userReviews = await this.database
        .select({
          id: reviews.id,
          user_id: reviews.user_id,
          text: reviews.text,
          rating: reviews.rating,
          createdAt: reviews.createdAt,
          updatedAt: reviews.updatedAt,
          name: users.name,
          picture: users.picture,
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.user_id, users.id))
        .limit(pageSize)
        .offset(offsetValue);

      return userReviews;
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
