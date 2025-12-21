import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { I18nService } from "nestjs-i18n";
import { Request } from "express";

import { User } from "@/auth/schema";
import { ResponseCode } from "@/types";
import { buildResponse } from "@/utils/response/response-wrapper";

import { CreateReviewDto, GetReviewsDto } from "./dto";
import ReviewsController from "./reviews.controller";
import ReviewsService from "./reviews.service";
import { Review } from "./schema";

// Mock I18nContext
jest.mock("nestjs-i18n", () => ({
  I18nContext: {
    current: jest.fn().mockReturnValue({ lang: "en" }),
  },
  I18nService: jest.fn().mockImplementation(() => ({
    t: jest.fn((key: string) => key),
  })),
  I18n: () => jest.fn(),
}));

// Mock data
const mockReview: Review = {
  id: "1",
  text: "This is a test review",
  rating: "5", // String as per schema
  user_id: "1",
  created_at: new Date("2023-12-01T10:00:00Z"),
  updated_at: new Date("2023-12-01T10:00:00Z"),
} as Review;

const mockUser: User = {
  id: "1",
  name: "Test User",
  email: "test@example.com",
  password: "hashed_password",
  picture: "https://example.com/avatar.jpg",
  created_at: new Date("2023-12-01T10:00:00Z"),
  updated_at: new Date("2023-12-01T10:00:00Z"),
};

// Mock service
const mockReviewsService = {
  getReviews: jest.fn(),
  createReview: jest.fn(),
  updateReview: jest.fn(),
  deleteReview: jest.fn(),
};

describe("ReviewsController", () => {
  let controller: ReviewsController;
  let service: ReviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        {
          provide: ReviewsService,
          useValue: mockReviewsService,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard())
      .useValue({
        canActivate: jest.fn((context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest<Request>();
          request.user = mockUser;
          return true;
        }),
      })
      .compile();

    controller = module.get<ReviewsController>(ReviewsController);
    service = module.get<ReviewsService>(ReviewsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getReviews", () => {
    it("should return paginated reviews", async () => {
      const mockData = [{ ...mockReview, name: "Test User", picture: "" }];
      const mockMeta = { total: 1, page: 1, limit: 10, total_pages: 1 };
      const queryDto: GetReviewsDto = { page: "1" };

      mockReviewsService.getReviews.mockResolvedValue({
        data: mockData,
        meta: mockMeta,
      });

      const result = await controller.getReviews(queryDto, mockUser as any);

      expect(service.getReviews).toHaveBeenCalledWith(queryDto, mockUser);
      expect(result.data).toEqual(mockData);
      expect(result.meta).toEqual(mockMeta);
    });
  });

  describe("createReview", () => {
    it("should create a new review", async () => {
      const createDto: CreateReviewDto = {
        text: "This is a new review",
        rating: "4",
      };

      mockReviewsService.createReview.mockResolvedValue(mockReview);

      const result = await controller.createReview(createDto, mockUser as any);

      expect(service.createReview).toHaveBeenCalledWith(createDto, mockUser);
      expect(result.data).toEqual(mockReview);
      expect(result.code).toBe(ResponseCode.CREATED);
    });
  });

  describe("updateReviewById", () => {
    it("should update a review", async () => {
      const updateDto: CreateReviewDto = {
        text: "This is an updated review",
        rating: "3",
      };
      const updatedReview = { ...mockReview, ...updateDto };

      mockReviewsService.updateReview.mockResolvedValue(updatedReview);

      const result = await controller.updateReviewById(
        updateDto,
        mockUser as any,
      );

      expect(service.updateReview).toHaveBeenCalledWith(mockUser.id, updateDto);
      expect(result).toEqual(updatedReview);
    });
  });

  describe("deleteReviewById", () => {
    it("should delete a review", async () => {
      const deletedReview = { ...mockReview };

      mockReviewsService.deleteReview.mockResolvedValue(deletedReview);

      const result = await controller.deleteReviewById(mockUser as any);

      expect(service.deleteReview).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(deletedReview);
    });
  });
});
