import { Injectable } from "@nestjs/common";

import { User } from "@/auth/schema";
import ReviewsRepository from "@/reviews/reviews.repository";
import { UserData } from "@/types";

@Injectable()
export class FormatDataService {
  constructor(private reviewsRepository: ReviewsRepository) {}

  async formatUserData(user: User): Promise<UserData> {
    const userReview = await this.reviewsRepository.getUserReviews(user.id);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      is_left_review: !!userReview,
    };
  }
}

export default FormatDataService;
