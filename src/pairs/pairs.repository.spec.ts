import { Test, TestingModule } from "@nestjs/testing";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

import { DATABASE_CONNECTION } from "@/database/database.connection";

import { PairsRepository } from "./pairs.repository";

// Mock database
const mockDatabase = {
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn(),
  select: jest.fn().mockReturnThis(),
  selectDistinct: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  onConflictDoUpdate: jest.fn().mockReturnThis(),
};

describe("PairsRepository", () => {
  let repository: PairsRepository;
  let database: NodePgDatabase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PairsRepository,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDatabase,
        },
      ],
    }).compile();

    repository = module.get<PairsRepository>(PairsRepository);
    database = module.get<NodePgDatabase>(DATABASE_CONNECTION);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  describe("createPairRequest", () => {
    it("should create a pair request", async () => {
      const mockRequest = {
        id: "request-1",
        requester_id: "user-1",
        requested_id: "user-2",
        status: "pending",
        expires_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDatabase.returning.mockResolvedValue([mockRequest]);

      const result = await repository.createPairRequest(
        "user-1",
        "user-2",
        new Date(),
      );

      expect(database.insert).toHaveBeenCalled();
      expect(result).toEqual(mockRequest);
    });
  });

  describe("findPairById", () => {
    it("should find a pair by id", async () => {
      const mockPair = {
        id: "pair-1",
        user1_id: "user-1",
        user2_id: "user-2",
        created_at: new Date(),
      };

      mockDatabase.limit.mockResolvedValue([mockPair]);

      const result = await repository.findPairById("pair-1");

      expect(database.select).toHaveBeenCalled();
      expect(result).toEqual(mockPair);
    });

    it("should return null if pair not found", async () => {
      mockDatabase.limit.mockResolvedValue([]);

      const result = await repository.findPairById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("createSession", () => {
    it("should create a session", async () => {
      const mockSession = {
        id: "session-1",
        pair_id: "pair-1",
        created_by_user_id: "user-1",
        media_type: "movie",
        status: "filter_pending",
        filters_proposed_at: null,
        filters_accepted_at: null,
        ended_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDatabase.returning.mockResolvedValue([mockSession]);

      const result = await repository.createSession(
        "pair-1",
        "user-1",
        "movie",
      );

      expect(database.insert).toHaveBeenCalled();
      expect(result).toEqual(mockSession);
    });
  });

  describe("createSwipe", () => {
    it("should create a swipe", async () => {
      const mockSwipe = {
        id: "swipe-1",
        session_id: "session-1",
        user_id: "user-1",
        tmdb_id: 550,
        media_type: "movie",
        direction: "right",
        created_at: new Date(),
      };

      mockDatabase.returning.mockResolvedValue([mockSwipe]);

      const result = await repository.createSwipe(
        "session-1",
        "user-1",
        550,
        "movie",
        "right",
      );

      expect(database.insert).toHaveBeenCalled();
      expect(result).toEqual(mockSwipe);
    });
  });

  describe("createMatch", () => {
    it("should create a match", async () => {
      const mockMatch = {
        id: "match-1",
        pair_id: "pair-1",
        session_id: "session-1",
        tmdb_id: 550,
        media_type: "movie",
        title: "Fight Club",
        poster_path: "/poster.jpg",
        overview: "An overview",
        matched_at: new Date(),
        marked_watched: false,
      };

      mockDatabase.returning.mockResolvedValue([mockMatch]);

      const result = await repository.createMatch(
        "pair-1",
        "session-1",
        550,
        "movie",
        "Fight Club",
        "/poster.jpg",
        "An overview",
      );

      expect(database.insert).toHaveBeenCalled();
      expect(result).toEqual(mockMatch);
    });
  });

  describe("getSwipedTmdbIdsForSession", () => {
    it("should return array of swiped tmdb ids", async () => {
      const mockResults = [
        { tmdb_id: 550 },
        { tmdb_id: 551 },
        { tmdb_id: 552 },
      ];

      mockDatabase.where.mockResolvedValue(mockResults);

      const result = await repository.getSwipedTmdbIdsForSession("session-1");

      expect(database.selectDistinct).toHaveBeenCalled();
      expect(result).toEqual([550, 551, 552]);
    });
  });

  describe("deleteOldSwipes", () => {
    it("should delete old swipes and return count", async () => {
      mockDatabase.where.mockResolvedValue({ rowCount: 100 });

      const result = await repository.deleteOldSwipes(30);

      expect(database.delete).toHaveBeenCalled();
      expect(result).toBe(100);
    });
  });
});
