import { AuthGuard } from "@nestjs/passport";
import { Test, TestingModule } from "@nestjs/testing";
import { I18nContext, I18nService } from "nestjs-i18n";

import { User } from "@/auth/schema";
import { buildResponse, ResponseCode } from "@/utils/response/response-wrapper";

import { CreateMovieDto, GetMoviesDto, UpdateMovieDto } from "./dto";
import MoviesController from "./movies.controller";
import MoviesService from "./movies.service";

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

// Mock service
const mockMoviesService = {
  getMovies: jest.fn(),
  createMovie: jest.fn(),
  updateMovie: jest.fn(),
  deleteMovie: jest.fn(),
  getUserMovieIds: jest.fn(),
};

describe("MoviesController", () => {
  let controller: MoviesController;
  let service: MoviesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        {
          provide: MoviesService,
          useValue: mockMoviesService,
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
        canActivate: jest.fn(context => {
          const request = context.switchToHttp().getRequest();
          request.user = mockUser;
          return true;
        }),
      })
      .compile();

    controller = module.get<MoviesController>(MoviesController);
    service = module.get<MoviesService>(MoviesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getMovies", () => {
    it("should return paginated movies", async () => {
      const query: GetMoviesDto = { page: "1", category: "favorites" };
      const mockResult = {
        data: [],
        meta: { total: 0, page: 1, limit: 10, total_pages: 0 },
      };

      mockMoviesService.getMovies.mockResolvedValue(mockResult);

      const result = await controller.getMovies(query, mockUser);

      expect(service.getMovies).toHaveBeenCalledWith(query, mockUser);
      expect(result).toEqual(
        buildResponse({
          data: mockResult.data,
          code: ResponseCode.OK,
          meta: mockResult.meta,
        }),
      );
    });
  });

  describe("createMovie", () => {
    it("should create a movie successfully", async () => {
      const createDto: CreateMovieDto = {
        title: "Test Movie",
        category: "favorites",
        idb_id: 123,
        vote_average: 8.5,
        genres: [],
        release_date: "2023-01-01",
        overview: "Test overview",
        poster_path: "",
        tagline: "",
        runtime: 0,
        budget: 0,
      };
      const mockMovie = {
        id: "1",
        ...createDto,
        user_id: "1",
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockMoviesService.createMovie.mockResolvedValue(mockMovie);

      const result = await controller.createMovie(createDto, mockUser);

      expect(service.createMovie).toHaveBeenCalledWith(createDto, mockUser);
      expect(result).toEqual(
        buildResponse({
          data: mockMovie,
          code: ResponseCode.CREATED,
          message: "content.movieCreated",
        }),
      );
    });
  });

  describe("updateMovieById", () => {
    it("should update a movie successfully", async () => {
      const updateDto: UpdateMovieDto = { category: "watched" };
      const mockMovie = { id: "1", title: "Test", category: "watched" };

      mockMoviesService.updateMovie.mockResolvedValue(mockMovie);

      const result = await controller.updateMovieById("1", updateDto, mockUser);

      expect(service.updateMovie).toHaveBeenCalledWith("1", updateDto);
      expect(result).toEqual(mockMovie);
    });
  });

  describe("deleteMovieById", () => {
    it("should delete a movie successfully", async () => {
      const mockMovie = { id: "1", title: "Test" };

      mockMoviesService.deleteMovie.mockResolvedValue(mockMovie);

      const result = await controller.deleteMovieById("1", mockUser);

      expect(service.deleteMovie).toHaveBeenCalledWith("1");
      expect(result).toEqual(mockMovie);
    });
  });
});
