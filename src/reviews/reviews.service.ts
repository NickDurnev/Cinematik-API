import { Injectable, NotFoundException } from "@nestjs/common";
import { User } from "@/auth/schema";
import { ReviewWithUser } from "@/types";

import { CreateReviewDto, GetReviewsDto } from "./dto";
import ReviewsRepository from "./reviews.repository";
import { Review } from "./schema";

@Injectable()
class ReviewsService {
  constructor(private reviewsRepository: ReviewsRepository) {}

  getReviews(getDto: GetReviewsDto, user: User): Promise<ReviewWithUser[]> {
    return this.reviewsRepository.getReviews(getDto, user);
  }

  createReview(CreateReviewDto: CreateReviewDto, user: User): Promise<Review> {
    return this.reviewsRepository.createReview(CreateReviewDto, user);
  }

  updateReviewById(
    id: string,
    updateReviewDto: CreateReviewDto,
  ): Promise<Review> {
    return this.reviewsRepository.updateReviewById(id, updateReviewDto);
  }

  async deleteReviewById(id: string): Promise<void> {
    const result = await this.reviewsRepository.deleteReview(id);

    if (!result) {
      throw new NotFoundException(`Review with ID: ${id} not found`);
    }
  }
}

export default ReviewsService;
