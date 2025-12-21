import { Test, TestingModule } from "@nestjs/testing";
import { I18nService } from "nestjs-i18n";

import ReviewsService from "./reviews.service";
import ReviewsRepository from "./reviews.repository";
import { Review } from "./schema";
import { CreateReviewDto, GetReviewsDto } from "./dto";
import { User } from "@/auth/schema";

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
  rating: "5",
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

// Mock repository
const mockReviewsRepository = {
  getReviews: jest.fn(),
  createReview: jest.fn(),
  updateReview: jest.fn(),
  deleteReview: jest.fn(),
};

describe("ReviewsService", () => {
  let service: ReviewsService;
  let repository: ReviewsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: ReviewsRepository,
          useValue: mockReviewsRepository,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    repository = module.get<ReviewsRepository>(ReviewsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getReviews", () => {
    it("should return paginated reviews", async () => {
      const mockResult = {
        data: [mockReview],
        meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
      };
      const queryDto: GetReviewsDto = { page: "1" };

      mockReviewsRepository.getReviews.mockResolvedValue(mockResult);

      const result = await service.getReviews(queryDto, mockUser);

      expect(repository.getReviews).toHaveBeenCalledWith(queryDto, mockUser);
      expect(result).toEqual(mockResult);
    });
  });

  describe("createReview", () => {
    it("should create a new review", async () => {
      const createDto: CreateReviewDto = { text: "New review", rating: "4" };
      mockReviewsRepository.createReview.mockResolvedValue(mockReview);

      const result = await service.createReview(createDto, mockUser);

      expect(repository.createReview).toHaveBeenCalledWith(createDto, mockUser);
      expect(result).toEqual(mockReview);
    });
  });

  describe("updateReview", () => {
    it("should update a review", async () => {
      const updateDto = { text: "Updated" };
      mockReviewsRepository.updateReview.mockResolvedValue(mockReview);

      const result = await service.updateReview(mockUser.id, updateDto);

      expect(repository.updateReview).toHaveBeenCalledWith(
        mockUser.id,
        updateDto,
      );
      expect(result).toEqual(mockReview);
    });
  });

  describe("deleteReview", () => {
    it("should delete a review", async () => {
      mockReviewsRepository.deleteReview.mockResolvedValue(mockReview);

      const result = await service.deleteReview(mockUser.id);

      expect(repository.deleteReview).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockReview);
    });
  });
});
