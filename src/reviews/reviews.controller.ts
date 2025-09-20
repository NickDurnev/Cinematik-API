import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { GetUser } from "@/auth/get-user.decorator";
import OptionalAuthGuard from "@/auth/optional-auth-guard";
import { User } from "@/auth/schema";
import { ResponseCode, ResponseWrapper } from "@/types";
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

@ApiTags("Reviews")
@Controller("reviews")
class ReviewsController {
  private logger = new Logger("ReviewsController");

  constructor(private reviewsService: ReviewsService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: "Get all reviews" })
  @ApiQuery({
    name: "page",
    required: true,
    type: String,
    description: "Page number",
  })
  @ApiResponse(GetReviewsApiResponse)
  async getReviews(
    @Query() getDto: GetReviewsDto,
    @GetUser() user: User,
  ): Promise<ResponseWrapper<Review[]>> {
    const { data, meta } = await this.reviewsService.getReviews(
      getDto,
      user ?? null,
    );
    return buildResponse({ data, meta });
  }

  @ApiBearerAuth()
  @Post()
  @UseGuards(AuthGuard())
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
    const data = await this.reviewsService.createReview(createReviewDto, user);
    return buildResponse({
      data,
      code: ResponseCode.CREATED,
      message: "Review created",
    });
  }

  @ApiBearerAuth()
  @Patch()
  @UseGuards(AuthGuard())
  @ApiOperation({ summary: "Update a review" })
  @ApiBody(UpdateReviewApiBody)
  @ApiResponse(UpdateReviewApiResponse)
  @ApiResponse({
    status: 404,
    description: "Review not found",
  })
  updateReviewById(
    @Body() updateReviewDto: CreateReviewDto,
    @GetUser() user: User,
  ): Promise<Review> {
    this.logger.verbose(
      `User "${user.name}" updating review. Data: ${JSON.stringify(
        updateReviewDto,
      )}`,
    );
    return this.reviewsService.updateReview(user.id, updateReviewDto);
  }

  @ApiBearerAuth()
  @Delete()
  @UseGuards(AuthGuard())
  @ApiOperation({ summary: "Delete a review" })
  @ApiResponse({
    status: 200,
    description: "Review deleted successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Review not found",
  })
  deleteReviewById(@GetUser() user: User): Promise<Review> {
    this.logger.verbose(`User "${user.name}" deleting review`);
    return this.reviewsService.deleteReview(user.id);
  }
}

export default ReviewsController;
