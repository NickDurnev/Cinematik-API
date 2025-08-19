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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { GetUser } from "@/auth/get-user.decorator";
import { User } from "@/auth/schema";
import { ResponseCode, ResponseWrapper } from "@/types";
import { buildResponse } from "@/utils/response/response-wrapper";

import { CreateMovieDto, GetMoviesDto, UpdateMovieDto } from "./dto";
import {
  CreateMovieApiBody,
  CreateMovieApiResponse,
  GetMoviesApiResponse,
  UpdateMovieApiBody,
  UpdateMovieApiResponse,
} from "./movies.docs";
import MoviesService from "./movies.service";
import { Movie } from "./schema";

@ApiTags("Movies")
@Controller("movies")
@UseGuards(AuthGuard())
class MoviesController {
  private logger = new Logger("MoviesController");

  constructor(private moviesService: MoviesService) {}

  @Get()
  @ApiOperation({ summary: "Get all movies" })
  @ApiQuery({
    name: "page",
    required: true,
    type: String,
    description: "Page number",
  })
  @ApiResponse(GetMoviesApiResponse)
  async getMovies(
    @Query() getDto: GetMoviesDto,
    @GetUser() user: User,
  ): Promise<ResponseWrapper<Movie[]>> {
    const { data, meta } = await this.moviesService.getMovies(getDto, user);
    return buildResponse({ data, meta });
  }

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: "Create a new movie" })
  @ApiBody(CreateMovieApiBody)
  @ApiResponse(CreateMovieApiResponse)
  @ApiResponse({
    status: 400,
    description: "Bad request - invalid movie data",
  })
  async createMovie(
    @Body() createMovieDto: CreateMovieDto,
    @GetUser() user: User,
  ): Promise<ResponseWrapper<Movie>> {
    this.logger.verbose(
      `User "${user.name}" creating a new movie. Data: ${JSON.stringify(
        createMovieDto,
      )}`,
    );
    const data = await this.moviesService.createMovie(createMovieDto, user);
    return buildResponse({
      data,
      code: ResponseCode.CREATED,
      message: "Movie created",
    });
  }

  @ApiBearerAuth()
  @Patch(":id")
  @ApiOperation({ summary: "Update a movie" })
  @ApiBody(UpdateMovieApiBody)
  @ApiResponse(UpdateMovieApiResponse)
  @ApiResponse({
    status: 404,
    description: "Movie not found",
  })
  updateMovieById(
    @Param("id") id: string,
    @Body() updateMovieDto: UpdateMovieDto,
    @GetUser() user: User,
  ): Promise<Movie> {
    this.logger.verbose(
      `User "${user.name}" updating movie ${id}. Data: ${JSON.stringify(
        updateMovieDto,
      )}`,
    );
    return this.moviesService.updateMovie(id, updateMovieDto);
  }

  @ApiBearerAuth()
  @Delete(":id")
  @ApiOperation({ summary: "Delete a movie" })
  @ApiResponse({
    status: 200,
    description: "Movie deleted successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Movie not found",
  })
  deleteMovieById(
    @Param("id") id: string,
    @GetUser() user: User,
  ): Promise<Movie> {
    this.logger.verbose(`User "${user.name}" deleting movie`);
    return this.moviesService.deleteMovie(id);
  }

  @Get("ids")
  @ApiOperation({ summary: "Get all user's movie IDB ids" })
  @ApiResponse({
    status: 200,
    description: "User's movie IDs retrieved successfully",
  })
  async getUserMovieIds(
    @GetUser() user: User,
  ): Promise<ResponseWrapper<number[]>> {
    const data = await this.moviesService.getUserMovieIds(user);
    return buildResponse({ data });
  }
}

export default MoviesController;
