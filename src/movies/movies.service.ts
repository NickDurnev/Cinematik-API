import { Injectable } from "@nestjs/common";

import { User } from "@/auth/schema";
import { PageMetaData } from "@/types";

import { CreateMovieDto, GetMoviesDto, UpdateMovieDto } from "./dto";
import MoviesRepository from "./movies.repository";
import { Movie } from "./schema";

@Injectable()
class MoviesService {
  constructor(private moviesRepository: MoviesRepository) {}

  getMovies(
    getDto: GetMoviesDto,
    user: User,
  ): Promise<{ data: Movie[]; meta: PageMetaData }> {
    return this.moviesRepository.getMovies(getDto, user);
  }

  createMovie(createMovieDto: CreateMovieDto, user: User): Promise<Movie> {
    return this.moviesRepository.createMovie(createMovieDto, user);
  }

  updateMovie(movieId: string, updateMovieDto: UpdateMovieDto): Promise<Movie> {
    return this.moviesRepository.updateMovie(movieId, updateMovieDto);
  }

  async deleteMovie(movieId: string): Promise<Movie> {
    return await this.moviesRepository.deleteMovie(movieId);
  }
}

export default MoviesService;
