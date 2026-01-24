import { Test, TestingModule } from "@nestjs/testing";
import { I18nService } from "nestjs-i18n";

import { User } from "@/auth/schema";
import { DATABASE_CONNECTION } from "@/database/database.connection";
import { PageMetaData, ReviewWithUser } from "@/types";

import { CreateReviewDto, GetReviewsDto, UpdateReviewDto } from "./dto";
import ReviewsRepository from "./reviews.repository";
import { Review, reviews } from "./schema";

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

const mockReviewWithUser: ReviewWithUser = {
  ...mockReview,
  name: "Test User",
  picture: "https://example.com/avatar.jpg",
};

const mockUser: User = {
  id: "1",
  name: "Test User",
  email: "test@example.com",
  password: "hashed_password",
  email_confirmed: true,
  picture: "https://example.com/avatar.jpg",
  created_at: new Date("2023-12-01T10:00:00Z"),
  updated_at: new Date("2023-12-01T10:00:00Z"),
};

// Mock database connection
const mockDatabase = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe("ReviewsRepository", () => {
  let repository: ReviewsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsRepository,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDatabase,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
      ],
    }).compile();

    repository = module.get<ReviewsRepository>(ReviewsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  describe("getReviews", () => {
    it("should return paginated reviews without user", async () => {
      const query: GetReviewsDto = { page: "1" };
      const mockData = [mockReviewWithUser];
      const mockMeta: PageMetaData = {
        total: 1,
        page: 1,
        limit: 10,
        total_pages: 1,
      };

      // Mock for data query
      const mockDataQuery = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(mockData),
      };

      // Mock for count query
      const mockCountQuery = {
        from: jest.fn().mockResolvedValue([{ count: 1 }]),
      };

      mockDatabase.select.mockImplementation((fields: any) => {
        if (fields && fields.count) {
          return mockCountQuery;
        }
        return mockDataQuery;
      });

      const result = await repository.getReviews(query, null);

      expect(result).toEqual({ data: mockData, meta: mockMeta });
    });
  });

  describe("createReview", () => {
    it("should create a new review", async () => {
      const createDto: CreateReviewDto = {
        text: "This is a new review",
        rating: "4",
      };

      const mockInsertChain = {
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockReview]),
        }),
      };

      (mockDatabase.insert as jest.Mock).mockReturnValue(mockInsertChain);

      const result = await repository.createReview(createDto, mockUser);

      expect(mockDatabase.insert).toHaveBeenCalledWith(reviews);
      expect(result).toEqual(mockReview);
    });
  });

  describe("updateReview", () => {
    it("should update a review", async () => {
      const updateData: UpdateReviewDto = {
        text: "Updated review",
        rating: "3",
      };
      const updatedReview = { ...mockReview, ...updateData };

      const mockUpdateChain = {
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedReview]),
          }),
        }),
      };

      (mockDatabase.update as jest.Mock).mockReturnValue(mockUpdateChain);

      const result = await repository.updateReview(mockUser.id, updateData);

      expect(mockDatabase.update).toHaveBeenCalledWith(reviews);
      expect(result).toEqual(updatedReview);
    });
  });

  describe("deleteReview", () => {
    it("should delete a review", async () => {
      const deletedReview = { ...mockReview };

      const mockDeleteChain = {
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([deletedReview]),
        }),
      };

      (mockDatabase.delete as jest.Mock).mockReturnValue(mockDeleteChain);

      const result = await repository.deleteReview(mockUser.id);

      expect(mockDatabase.delete).toHaveBeenCalledWith(reviews);
      expect(result).toEqual(deletedReview);
    });
  });
});
