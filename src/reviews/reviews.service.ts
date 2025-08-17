import { Injectable } from "@nestjs/common";

import { User } from "@/auth/schema";
import { PageMetaData, ReviewWithUser } from "@/types";

import { CreateReviewDto, GetReviewsDto, UpdateReviewDto } from "./dto";
import ReviewsRepository from "./reviews.repository";
import { Review } from "./schema";

@Injectable()
class ReviewsService {
  constructor(private reviewsRepository: ReviewsRepository) {}

  getReviews(
    getDto: GetReviewsDto,
    user: User | null,
  ): Promise<{ data: ReviewWithUser[]; meta: PageMetaData }> {
    return this.reviewsRepository.getReviews(getDto, user);
  }

  createReview(createReviewDto: CreateReviewDto, user: User): Promise<Review> {
    return this.reviewsRepository.createReview(createReviewDto, user);
  }

  updateReview(
    userId: string,
    updateReviewDto: UpdateReviewDto,
  ): Promise<Review> {
    return this.reviewsRepository.updateReview(userId, updateReviewDto);
  }

  async deleteReview(userId: string): Promise<Review> {
    return await this.reviewsRepository.deleteReview(userId);
  }
}

export default ReviewsService;
