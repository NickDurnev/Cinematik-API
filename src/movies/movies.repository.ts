import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

import { User } from "@/auth/schema";
import { DATABASE_CONNECTION } from "@/database/database.connection";
import { PageMetaData } from "@/types";

import { CreateMovieDto, GetMoviesDto, UpdateMovieDto } from "./dto";
import { Movie, movies } from "./schema";

@Injectable()
class MoviesRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly database: NodePgDatabase,
  ) {}

  private logger = new Logger("MoviesRepository");

  async getMovies(
    getDto: GetMoviesDto,
    user: User,
  ): Promise<{ data: Movie[]; meta: PageMetaData }> {
    const { page, category } = getDto;
    const pageSize = 10;
    const pageNumber = parseInt(page, 10) || 1;
    const offsetValue = (pageNumber - 1) * pageSize;

    try {
      // 1. Get paginated movies
      const userMovies = await this.database
        .select()
        .from(movies)
        .where(and(eq(movies.category, category), eq(movies.user_id, user.id)))
        .limit(pageSize)
        .offset(offsetValue);
      // 2. Get total count (filtered)
      const [{ count }] = await this.database
        .select({ count: sql<number>`count(*)` })
        .from(movies)
        .where(and(eq(movies.category, category), eq(movies.user_id, user.id)));
      // 3. Build meta
      const total = Number(count);
      const totalPages = Math.ceil(total / pageSize);
      return {
        data: userMovies,
        meta: {
          total,
          page: pageNumber,
          limit: pageSize,
          total_pages: totalPages,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get movies". GetDto: ${JSON.stringify(getDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async createMovie(
    createMovieDto: CreateMovieDto,
    user: User,
  ): Promise<Movie> {
    try {
      const [newMovie] = await this.database
        .insert(movies)
        .values({
          user_id: user.id,
          ...createMovieDto,
        })
        .returning();

      return newMovie;
    } catch (error) {
      this.logger.error(
        `Failed to create movie for user "${user.name}". CreateDto: ${JSON.stringify(createMovieDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async updateMovie(
    movieId: string,
    updateMovieDto: UpdateMovieDto,
  ): Promise<Movie> {
    const { category } = updateMovieDto;

    try {
      const [updatedMovie] = await this.database
        .update(movies)
        .set({
          ...(category && { category }),
        })
        .where(eq(movies.id, movieId))
        .returning();

      if (!updatedMovie) {
        throw new Error("Movie not found");
      }

      return updatedMovie;
    } catch (error) {
      this.logger.error(
        `Failed to update movie. UpdateDto: ${JSON.stringify(updateMovieDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async deleteMovie(movieId: string): Promise<Movie> {
    try {
      const [deletedMovie] = await this.database
        .delete(movies)
        .where(eq(movies.id, movieId))
        .returning();

      if (!deletedMovie) {
        throw new Error("Movie not found");
      }

      return deletedMovie;
    } catch (error) {
      this.logger.error("Failed to delete movie", error.stack);
      throw new InternalServerErrorException();
    }
  }

  async getUserMovieIds(user: User): Promise<number[]> {
    try {
      const rows = await this.database
        .select({ idb_id: movies.idb_id })
        .from(movies)
        .where(eq(movies.user_id, user.id));
      return rows.map(row => row.idb_id);
    } catch (error) {
      this.logger.error("Failed to get user movie ids", error.stack);
      throw new InternalServerErrorException();
    }
  }
}

export default MoviesRepository;
