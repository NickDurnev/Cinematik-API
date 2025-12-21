import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { I18nService } from "nestjs-i18n";

import { User } from "@/auth/schema";
import { PageMetaData } from "@/types";

import { CreateMovieDto, GetMoviesDto, UpdateMovieDto } from "./dto";
import MoviesRepository from "./movies.repository";
import MoviesService from "./movies.service";
import { Movie } from "./schema";

// Mock data
const mockMovie: Movie = {
  id: "1",
  title: "Test Movie",
  category: "favorites", // Using valid enum value
  user_id: "1",
  idb_id: 1, // Using number instead of string
  poster_path: "/poster/path.jpg",
  vote_average: 7.5,
  genres: [
    { id: "28", name: "Action" },
    { id: "12", name: "Adventure" },
  ],
  release_date: "2023-01-01",
  runtime: 120,
  budget: 1000000,
  overview: "A test movie overview",
  tagline: "A test movie tagline",
  created_at: new Date("2023-12-01T10:00:00Z"),
  updated_at: new Date("2023-12-01T10:00:00Z"),
};

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
const mockMoviesRepository = {
  getMovies: jest.fn(),
  createMovie: jest.fn(),
  updateMovie: jest.fn(),
  deleteMovie: jest.fn(),
  getUserMovieIds: jest.fn(),
};

describe("MoviesService", () => {
  let service: MoviesService;
  let repository: MoviesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: MoviesRepository,
          useValue: mockMoviesRepository,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    repository = module.get<MoviesRepository>(MoviesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getMovies", () => {
    it("should return paginated movies", async () => {
      const mockData = [mockMovie];
      const mockMeta: PageMetaData = {
        total: 1,
        page: 1,
        limit: 10,
        total_pages: 1,
      };
      const queryDto: GetMoviesDto = { page: "1", category: "favorites" };
      const expectedResult = { data: mockData, meta: mockMeta };

      mockMoviesRepository.getMovies.mockResolvedValue(expectedResult);

      const result = await service.getMovies(queryDto, mockUser);

      expect(repository.getMovies).toHaveBeenCalledWith(queryDto, mockUser);
      expect(result).toEqual(expectedResult);
    });

    it("should handle repository errors", async () => {
      const queryDto: GetMoviesDto = { page: "1", category: "favorites" };

      mockMoviesRepository.getMovies.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(service.getMovies(queryDto, mockUser)).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("createMovie", () => {
    it("should create a new movie", async () => {
      const createDto: CreateMovieDto = {
        title: "New Movie",
        category: "favorites", // Using valid enum value
        idb_id: 123, // Using number instead of string
        poster_path: "/poster/path.jpg",
        vote_average: 7.5,
        genres: [
          { id: "28", name: "Action" },
          { id: "12", name: "Adventure" },
        ],
        release_date: "2023-01-01",
        runtime: 120,
        budget: 1000000,
        overview: "A new movie overview",
        tagline: "A new movie tagline",
      };
      const newMovie = { ...mockMovie, title: createDto.title };

      mockMoviesRepository.createMovie.mockResolvedValue(newMovie);

      const result = await service.createMovie(createDto, mockUser);

      expect(repository.createMovie).toHaveBeenCalledWith(createDto, mockUser);
      expect(result).toEqual(newMovie);
    });

    it("should handle repository errors during creation", async () => {
      const createDto: CreateMovieDto = {
        title: "New Movie",
        category: "favorites", // Using valid enum value
        idb_id: 123,
        poster_path: "/poster/path.jpg",
        vote_average: 7.5,
        genres: [
          { id: "28", name: "Action" },
          { id: "12", name: "Adventure" },
        ],
        release_date: "2023-01-01",
        runtime: 120,
        budget: 1000000,
        overview: "A new movie overview",
      };

      mockMoviesRepository.createMovie.mockRejectedValue(
        new Error("Failed to create movie"),
      );

      await expect(service.createMovie(createDto, mockUser)).rejects.toThrow(
        "Failed to create movie",
      );
    });
  });

  describe("updateMovie", () => {
    it("should update a movie", async () => {
      const movieId = "1";
      const updateDto: UpdateMovieDto = { category: "watched" }; // Using valid enum value
      const updatedMovie = { ...mockMovie, id: movieId, category: "watched" };

      mockMoviesRepository.updateMovie.mockResolvedValue(updatedMovie);

      const result = await service.updateMovie(movieId, updateDto);

      expect(repository.updateMovie).toHaveBeenCalledWith(movieId, updateDto);
      expect(result).toEqual(updatedMovie);
    });

    it("should handle movie not found", async () => {
      const movieId = "999";
      const updateDto: UpdateMovieDto = { category: "watched" }; // Using valid enum value

      mockMoviesRepository.updateMovie.mockRejectedValue(
        new Error("Movie not found"),
      );

      await expect(service.updateMovie(movieId, updateDto)).rejects.toThrow(
        "Movie not found",
      );
    });
  });

  describe("deleteMovie", () => {
    it("should delete a movie", async () => {
      const movieId = "1";
      const deletedMovie = { ...mockMovie, id: movieId };

      mockMoviesRepository.deleteMovie.mockResolvedValue(deletedMovie);

      const result = await service.deleteMovie(movieId);

      expect(repository.deleteMovie).toHaveBeenCalledWith(movieId);
      expect(result).toEqual(deletedMovie);
    });

    it("should handle movie not found during deletion", async () => {
      const movieId = "999";

      mockMoviesRepository.deleteMovie.mockRejectedValue(
        new Error("Movie not found"),
      );

      await expect(service.deleteMovie(movieId)).rejects.toThrow(
        "Movie not found",
      );
    });
  });

  describe("getUserMovieIds", () => {
    it("should return user movie IDs", async () => {
      const mockIds: Pick<Movie, "id" | "idb_id" | "category">[] = [
        { id: "1", idb_id: 1, category: "favorites" },
        { id: "2", idb_id: 2, category: "watched" },
      ];

      mockMoviesRepository.getUserMovieIds.mockResolvedValue(mockIds);

      const result = await service.getUserMovieIds(mockUser);

      expect(repository.getUserMovieIds).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockIds);
    });

    it("should handle user with no movies", async () => {
      const mockIds: Pick<Movie, "id" | "idb_id" | "category">[] = [];

      mockMoviesRepository.getUserMovieIds.mockResolvedValue(mockIds);

      const result = await service.getUserMovieIds(mockUser);

      expect(repository.getUserMovieIds).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual([]);
    });
  });
});
