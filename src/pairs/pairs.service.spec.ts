import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { User } from "@/auth/schema";
import { TMDBService } from "@/common/services/tmdb.service";

import { PairsService } from "./pairs.service";
import { PairsRepository } from "./pairs.repository";
import {
  SendPairRequestDto,
  PairRequestAction,
  CreateSessionDto,
  ProposeFiltersDto,
  RecordSwipeDto,
  SwipeDirection,
  MediaType,
} from "./dto";
import {
  PairRequest,
  Pair,
  PairSession,
  SessionFilter,
  Swipe,
  PairMatch,
} from "./schema";

// Mock data
const mockUser1: User = {
  id: "user-1",
  name: "User One",
  email: "user1@example.com",
  password: "hashed_password",
  picture: "https://example.com/avatar1.jpg",
  email_confirmed: true,
  created_at: new Date("2023-12-01T10:00:00Z"),
  updated_at: new Date("2023-12-01T10:00:00Z"),
};

const mockUser2: User = {
  id: "user-2",
  name: "User Two",
  email: "user2@example.com",
  password: "hashed_password",
  picture: "https://example.com/avatar2.jpg",
  email_confirmed: true,
  created_at: new Date("2023-12-01T10:00:00Z"),
  updated_at: new Date("2023-12-01T10:00:00Z"),
};

const mockPairRequest: PairRequest = {
  id: "request-1",
  requester_id: mockUser1.id,
  requested_id: mockUser2.id,
  status: "pending",
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  created_at: new Date("2024-01-08T00:00:00Z"),
  updated_at: new Date("2024-01-08T00:00:00Z"),
};

const mockPair: Pair = {
  id: "pair-1",
  user1_id: mockUser1.id,
  user2_id: mockUser2.id,
  created_at: new Date("2024-01-08T00:00:00Z"),
};

const mockSession: PairSession = {
  id: "session-1",
  pair_id: mockPair.id,
  created_by_user_id: mockUser1.id,
  media_type: "movie",
  status: "filter_pending",
  filters_proposed_at: null,
  filters_accepted_at: null,
  ended_at: null,
  created_at: new Date("2024-01-08T00:00:00Z"),
  updated_at: new Date("2024-01-08T00:00:00Z"),
};

const mockFilters: SessionFilter = {
  id: "filter-1",
  session_id: mockSession.id,
  year_min: 2000,
  year_max: 2024,
  genre_ids: [28, 12],
  created_at: new Date("2024-01-08T00:00:00Z"),
  updated_at: new Date("2024-01-08T00:00:00Z"),
};

const mockSwipe: Swipe = {
  id: "swipe-1",
  session_id: mockSession.id,
  user_id: mockUser1.id,
  tmdb_id: 550,
  media_type: "movie",
  direction: "right",
  created_at: new Date("2024-01-08T00:00:00Z"),
};

const mockMatch: PairMatch = {
  id: "match-1",
  pair_id: mockPair.id,
  session_id: mockSession.id,
  tmdb_id: 550,
  media_type: "movie",
  title: "Fight Club",
  poster_path: "/poster.jpg",
  overview: "An overview",
  matched_at: new Date("2024-01-08T00:00:00Z"),
  marked_watched: false,
};

// Mock repository
const mockPairsRepository = {
  findUserByUsernameOrEmail: jest.fn(),
  findPair: jest.fn(),
  findPendingRequest: jest.fn(),
  createPairRequest: jest.fn(),
  getPendingRequestsForUser: jest.fn(),
  findPairRequestById: jest.fn(),
  updatePairRequestStatus: jest.fn(),
  createPair: jest.fn(),
  getUserPairs: jest.fn(),
  findPairById: jest.fn(),
  deletePair: jest.fn(),
  createSession: jest.fn(),
  findActiveSession: jest.fn(),
  findSessionById: jest.fn(),
  updateSessionStatus: jest.fn(),
  createOrUpdateSessionFilters: jest.fn(),
  getSessionFilters: jest.fn(),
  createSwipe: jest.fn(),
  findOppositeUserSwipe: jest.fn(),
  getSwipedTmdbIdsForSession: jest.fn(),
  createMatch: jest.fn(),
  getMatches: jest.fn(),
  findMatchById: jest.fn(),
  updateMatchWatchedStatus: jest.fn(),
  deleteOldSwipes: jest.fn(),
};

// Mock TMDB service
const mockTMDBService = {
  discoverMovies: jest.fn(),
  discoverTVShows: jest.fn(),
  getMovieGenres: jest.fn(),
  getTVGenres: jest.fn(),
};

describe("PairsService", () => {
  let service: PairsService;
  let repository: PairsRepository;
  let tmdbService: TMDBService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PairsService,
        {
          provide: PairsRepository,
          useValue: mockPairsRepository,
        },
        {
          provide: TMDBService,
          useValue: mockTMDBService,
        },
      ],
    }).compile();

    service = module.get<PairsService>(PairsService);
    repository = module.get<PairsRepository>(PairsRepository);
    tmdbService = module.get<TMDBService>(TMDBService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("sendPairRequest", () => {
    it("should send a pair request successfully", async () => {
      const dto: SendPairRequestDto = { username: "User Two" };

      mockPairsRepository.findUserByUsernameOrEmail.mockResolvedValue(
        mockUser2,
      );
      mockPairsRepository.findPair.mockResolvedValue(null);
      mockPairsRepository.findPendingRequest.mockResolvedValue(null);
      mockPairsRepository.createPairRequest.mockResolvedValue(mockPairRequest);

      const result = await service.sendPairRequest(mockUser1, dto);

      expect(repository.findUserByUsernameOrEmail).toHaveBeenCalledWith(
        "User Two",
        undefined,
      );
      expect(repository.createPairRequest).toHaveBeenCalled();
      expect(result).toEqual(mockPairRequest);
    });

    it("should throw error if user not found", async () => {
      const dto: SendPairRequestDto = { username: "NonExistent" };

      mockPairsRepository.findUserByUsernameOrEmail.mockResolvedValue(null);

      await expect(service.sendPairRequest(mockUser1, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw error if trying to invite self", async () => {
      const dto: SendPairRequestDto = { username: "User One" };

      mockPairsRepository.findUserByUsernameOrEmail.mockResolvedValue(
        mockUser1,
      );

      await expect(service.sendPairRequest(mockUser1, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw error if pair already exists", async () => {
      const dto: SendPairRequestDto = { username: "User Two" };

      mockPairsRepository.findUserByUsernameOrEmail.mockResolvedValue(
        mockUser2,
      );
      mockPairsRepository.findPair.mockResolvedValue(mockPair);

      await expect(service.sendPairRequest(mockUser1, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw error if pending request already exists", async () => {
      const dto: SendPairRequestDto = { username: "User Two" };

      mockPairsRepository.findUserByUsernameOrEmail.mockResolvedValue(
        mockUser2,
      );
      mockPairsRepository.findPair.mockResolvedValue(null);
      mockPairsRepository.findPendingRequest.mockResolvedValueOnce(
        mockPairRequest,
      );

      await expect(service.sendPairRequest(mockUser1, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("respondToPairRequest", () => {
    it("should accept a pair request and create pair", async () => {
      mockPairsRepository.findPairRequestById.mockResolvedValue(
        mockPairRequest,
      );
      mockPairsRepository.updatePairRequestStatus.mockResolvedValue({
        ...mockPairRequest,
        status: "accepted",
      });
      mockPairsRepository.createPair.mockResolvedValue(mockPair);

      const result = await service.respondToPairRequest(
        mockUser2,
        mockPairRequest.id,
        PairRequestAction.ACCEPT,
      );

      expect(repository.updatePairRequestStatus).toHaveBeenCalledWith(
        mockPairRequest.id,
        "accepted",
      );
      expect(repository.createPair).toHaveBeenCalled();
      expect(result.pair).toEqual(mockPair);
    });

    it("should reject a pair request without creating pair", async () => {
      mockPairsRepository.findPairRequestById.mockResolvedValue(
        mockPairRequest,
      );
      mockPairsRepository.updatePairRequestStatus.mockResolvedValue({
        ...mockPairRequest,
        status: "rejected",
      });

      const result = await service.respondToPairRequest(
        mockUser2,
        mockPairRequest.id,
        PairRequestAction.REJECT,
      );

      expect(repository.updatePairRequestStatus).toHaveBeenCalledWith(
        mockPairRequest.id,
        "rejected",
      );
      expect(repository.createPair).not.toHaveBeenCalled();
      expect(result.pair).toBeUndefined();
    });

    it("should throw error if not the requested user", async () => {
      mockPairsRepository.findPairRequestById.mockResolvedValue(
        mockPairRequest,
      );

      await expect(
        service.respondToPairRequest(
          mockUser1,
          mockPairRequest.id,
          PairRequestAction.ACCEPT,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw error if request already responded to", async () => {
      mockPairsRepository.findPairRequestById.mockResolvedValue({
        ...mockPairRequest,
        status: "accepted",
      });

      await expect(
        service.respondToPairRequest(
          mockUser2,
          mockPairRequest.id,
          PairRequestAction.ACCEPT,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("createSession", () => {
    it("should create a session successfully", async () => {
      const dto: CreateSessionDto = { mediaType: MediaType.MOVIE };

      mockPairsRepository.findPairById.mockResolvedValue(mockPair);
      mockPairsRepository.findActiveSession.mockResolvedValue(null);
      mockPairsRepository.createSession.mockResolvedValue(mockSession);

      const result = await service.createSession(mockUser1, mockPair.id, dto);

      expect(repository.createSession).toHaveBeenCalledWith(
        mockPair.id,
        mockUser1.id,
        "movie",
      );
      expect(result).toEqual(mockSession);
    });

    it("should throw error if pair not found", async () => {
      const dto: CreateSessionDto = { mediaType: MediaType.MOVIE };

      mockPairsRepository.findPairById.mockResolvedValue(null);

      await expect(
        service.createSession(mockUser1, "invalid-pair", dto),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw error if active session exists", async () => {
      const dto: CreateSessionDto = { mediaType: MediaType.MOVIE };

      mockPairsRepository.findPairById.mockResolvedValue(mockPair);
      mockPairsRepository.findActiveSession.mockResolvedValue(mockSession);

      await expect(
        service.createSession(mockUser1, mockPair.id, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw error if user not part of pair", async () => {
      const dto: CreateSessionDto = { mediaType: MediaType.MOVIE };
      const otherUser: User = { ...mockUser1, id: "user-3" };

      mockPairsRepository.findPairById.mockResolvedValue(mockPair);

      await expect(
        service.createSession(otherUser, mockPair.id, dto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("proposeFilters", () => {
    it("should propose filters successfully", async () => {
      const dto: ProposeFiltersDto = {
        yearMin: 2000,
        yearMax: 2024,
        genreIds: [28, 12],
      };

      mockPairsRepository.findSessionById.mockResolvedValue(mockSession);
      mockPairsRepository.findPairById.mockResolvedValue(mockPair);
      mockPairsRepository.createOrUpdateSessionFilters.mockResolvedValue(
        mockFilters,
      );
      mockPairsRepository.updateSessionStatus.mockResolvedValue({
        ...mockSession,
        filters_proposed_at: new Date(),
      });

      const result = await service.proposeFilters(
        mockUser1,
        mockSession.id,
        dto,
      );

      expect(repository.createOrUpdateSessionFilters).toHaveBeenCalled();
      expect(result.filters).toEqual(mockFilters);
    });

    it("should throw error if yearMin > yearMax", async () => {
      const dto: ProposeFiltersDto = {
        yearMin: 2024,
        yearMax: 2000,
      };

      mockPairsRepository.findSessionById.mockResolvedValue(mockSession);
      mockPairsRepository.findPairById.mockResolvedValue(mockPair);

      await expect(
        service.proposeFilters(mockUser1, mockSession.id, dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("recordSwipe", () => {
    it("should record swipe and detect match", async () => {
      const dto: RecordSwipeDto = {
        tmdbId: 550,
        direction: SwipeDirection.RIGHT,
      };

      const activeSession = { ...mockSession, status: "active" as const };

      mockPairsRepository.findSessionById.mockResolvedValue(activeSession);
      mockPairsRepository.findPairById.mockResolvedValue(mockPair);
      mockPairsRepository.createSwipe.mockResolvedValue(mockSwipe);
      mockPairsRepository.findOppositeUserSwipe.mockResolvedValue({
        ...mockSwipe,
        user_id: mockUser2.id,
        direction: "right",
      });
      mockTMDBService.discoverMovies.mockResolvedValue({
        id: 550,
        title: "Fight Club",
        poster_path: "/poster.jpg",
        overview: "An overview",
      });
      mockPairsRepository.createMatch.mockResolvedValue(mockMatch);

      const result = await service.recordSwipe(mockUser1, mockSession.id, dto);

      expect(result.matched).toBe(true);
      expect(result.match).toEqual(mockMatch);
      expect(repository.createMatch).toHaveBeenCalled();
    });

    it("should record swipe without match if opposite user swiped left", async () => {
      const dto: RecordSwipeDto = {
        tmdbId: 550,
        direction: SwipeDirection.RIGHT,
      };

      const activeSession = { ...mockSession, status: "active" as const };

      mockPairsRepository.findSessionById.mockResolvedValue(activeSession);
      mockPairsRepository.findPairById.mockResolvedValue(mockPair);
      mockPairsRepository.createSwipe.mockResolvedValue(mockSwipe);
      mockPairsRepository.findOppositeUserSwipe.mockResolvedValue({
        ...mockSwipe,
        user_id: mockUser2.id,
        direction: "left",
      });

      const result = await service.recordSwipe(mockUser1, mockSession.id, dto);

      expect(result.matched).toBe(false);
      expect(repository.createMatch).not.toHaveBeenCalled();
    });

    it("should throw error if session not active", async () => {
      const dto: RecordSwipeDto = {
        tmdbId: 550,
        direction: SwipeDirection.RIGHT,
      };

      mockPairsRepository.findSessionById.mockResolvedValue(mockSession);
      mockPairsRepository.findPairById.mockResolvedValue(mockPair);

      await expect(
        service.recordSwipe(mockUser1, mockSession.id, dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getMatches", () => {
    it("should return matches for a pair", async () => {
      const dto = { mediaType: MediaType.MOVIE };

      mockPairsRepository.findPairById.mockResolvedValue(mockPair);
      mockPairsRepository.getMatches.mockResolvedValue([mockMatch]);

      const result = await service.getMatches(mockUser1, mockPair.id, dto);

      expect(repository.getMatches).toHaveBeenCalledWith(mockPair.id, {
        mediaType: "movie",
        markedWatched: undefined,
      });
      expect(result).toEqual([mockMatch]);
    });

    it("should throw error if user not part of pair", async () => {
      const dto = {};
      const otherUser: User = { ...mockUser1, id: "user-3" };

      mockPairsRepository.findPairById.mockResolvedValue(mockPair);

      await expect(
        service.getMatches(otherUser, mockPair.id, dto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("cleanupOldSwipes", () => {
    it("should delete old swipes", async () => {
      mockPairsRepository.deleteOldSwipes.mockResolvedValue(100);

      await service.cleanupOldSwipes();

      expect(repository.deleteOldSwipes).toHaveBeenCalledWith(30);
    });
  });
});
