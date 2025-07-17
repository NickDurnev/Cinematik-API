import { Injectable, NotFoundException } from "@nestjs/common";

import { User } from "@/auth/schema";
import { PageMetaData, ReviewWithUser } from "@/types";

import { CreateReviewDto, GetReviewsDto } from "./dto";
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

  createReview(CreateReviewDto: CreateReviewDto, user: User): Promise<Review> {
    return this.reviewsRepository.createReview(CreateReviewDto, user);
  }

  updateReview(
    userId: string,
    updateReviewDto: CreateReviewDto,
  ): Promise<Review> {
    return this.reviewsRepository.updateReview(userId, updateReviewDto);
  }

  async deleteReview(userId: string): Promise<Review> {
    const result = await this.reviewsRepository.deleteReview(userId);

    if (!result) {
      throw new NotFoundException("Review not found");
    }

    return result;
  }
}

export default ReviewsService;
