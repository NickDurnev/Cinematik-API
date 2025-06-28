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
import { GetUser } from "@/auth/get-user.decorator";
import { User } from "@/auth/schema";
import { ReviewWithUser } from "@/types";

import { CreateReviewDto, GetReviewsDto } from "./dto";
import ReviewsService from "./reviews.service";
import { Review } from "./schema";

@Controller("reviews")
@UseGuards(AuthGuard())
class ReviewsController {
  private logger = new Logger("ReviewsController");

  constructor(private reviewsService: ReviewsService) {}

  @Get()
  getReviews(
    @Query() getDto: GetReviewsDto,
    @GetUser() user: User,
  ): Promise<ReviewWithUser[]> {
    this.logger.verbose(
      `User "${user.name}" retrieving all reviews. GET: ${JSON.stringify(
        getDto,
      )}`,
    );
    return this.reviewsService.getReviews(getDto, user);
  }

  @Post()
  creaateReview(
    @Body() createReviewDto: CreateReviewDto,
    @GetUser() user: User,
  ): Promise<Review> {
    this.logger.verbose(
      `User "${user.name}" creating a new task. Data: ${JSON.stringify(
        createReviewDto,
      )}`,
    );
    return this.reviewsService.createReview(createReviewDto, user);
  }

  @Patch("/:id")
  updateReviewById(
    @Param('id') id: string,
    @Body() updateReviewDto: CreateReviewDto,
    @GetUser() user: User,
  ): Promise<Review> {
    return this.reviewsService.updateReviewById(id, updateReviewDto);
  }

  @Delete("/:id")
  deleteTaskById(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.reviewsService.deleteReviewById(id);
  }
}

export default ReviewsController;