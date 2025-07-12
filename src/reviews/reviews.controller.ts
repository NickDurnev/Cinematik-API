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
import { ResponseCode, ResponseWrapper, ReviewWithUser } from "@/types";
import { buildResponse } from "@/utils/response/response-wrapper";

import { CreateReviewDto, GetReviewsDto } from "./dto";
import {
  CreateReviewApiBody,
  CreateReviewApiResponse,
  GetReviewsApiResponse,
  UpdateReviewApiBody,
  UpdateReviewApiResponse,
} from "./reviews.docs";
import ReviewsService from "./reviews.service";
import { Review } from "./schema";

@ApiBearerAuth()
@ApiTags("Reviews")
@Controller("reviews")
@UseGuards(AuthGuard())
class ReviewsController {
  private logger = new Logger("ReviewsController");

  constructor(private reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: "Get all reviews" })
  @ApiQuery({
    name: "page",
    required: true,
    type: Number,
    description: "Page number",
  })
  @ApiResponse(GetReviewsApiResponse)
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
  @ApiOperation({ summary: "Create a new review" })
  @ApiBody(CreateReviewApiBody)
  @ApiResponse(CreateReviewApiResponse)
  @ApiResponse({
    status: 400,
    description: "Bad request - invalid review data",
  })
  async createReview(
    @Body() createReviewDto: CreateReviewDto,
    @GetUser() user: User,
  ): Promise<ResponseWrapper<Review>> {
    this.logger.verbose(
      `User "${user.name}" creating a new review. Data: ${JSON.stringify(
        createReviewDto,
      )}`,
    );
    const review = await this.reviewsService.createReview(
      createReviewDto,
      user,
    );
    return buildResponse(review, ResponseCode.CREATED, "Review created");
  }

  @Patch("/:id")
  @ApiOperation({ summary: "Update a review" })
  @ApiParam({
    name: "id",
    description: "Review ID to update",
    type: String,
  })
  @ApiBody(UpdateReviewApiBody)
  @ApiResponse(UpdateReviewApiResponse)
  @ApiResponse({
    status: 404,
    description: "Review not found",
  })
  updateReviewById(
    @Param('id') id: string,
    @Body() updateReviewDto: CreateReviewDto,
    @GetUser() user: User,
  ): Promise<Review> {
    this.logger.verbose(
      `User "${user.name}" updating review with ID: ${id}. Data: ${JSON.stringify(
        updateReviewDto,
      )}`,
    );
    return this.reviewsService.updateReviewById(id, updateReviewDto);
  }

  @Delete("/:id")
  @ApiOperation({ summary: "Delete a review" })
  @ApiParam({
    name: "id",
    description: "Review ID to delete",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Review deleted successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Review not found",
  })
  deleteReviewById(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<void> {
    this.logger.verbose(`User "${user.name}" deleting review with ID: ${id}`);
    return this.reviewsService.deleteReviewById(id);
  }
}

export default ReviewsController;
