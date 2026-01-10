import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface DiscoverFilters {
  yearMin?: number;
  yearMax?: number;
  genreIds?: number[];
}

interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
}

interface TMDBTVShow {
  id: number;
  name: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
  first_air_date: string;
  genre_ids: number[];
}

interface DiscoverResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

interface Genre {
  id: number;
  name: string;
}

interface GenreResponse {
  genres: Genre[];
}

@Injectable()
export class TMDBService {
  private readonly logger = new Logger(TMDBService.name);
  private readonly baseUrl = "https://api.themoviedb.org/3";
  private readonly apiKey: string;
  private movieGenresCache: Genre[] | null = null;
  private tvGenresCache: Genre[] | null = null;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>("TMDB_API_KEY") || "";
    if (!this.apiKey) {
      this.logger.warn("TMDB_API_KEY not configured");
    }
  }

  /**
   * Discover movies with filters
   */
  async discoverMovies(
    filters: DiscoverFilters,
    excludeTmdbIds: number[] = [],
  ): Promise<TMDBMovie | null> {
    try {
      const params = new URLSearchParams({
        api_key: this.apiKey,
        language: "en-US",
        sort_by: "popularity.desc",
        include_adult: "false",
        include_video: "false",
      });

      if (filters.genreIds && filters.genreIds.length > 0) {
        params.append("with_genres", filters.genreIds.join(","));
      }

      if (filters.yearMin) {
        params.append("primary_release_date.gte", `${filters.yearMin}-01-01`);
      }

      if (filters.yearMax) {
        params.append("primary_release_date.lte", `${filters.yearMax}-12-31`);
      }

      // First, get total pages to select a random page
      const initialResponse = await fetch(
        `${this.baseUrl}/discover/movie?${params.toString()}`,
      );

      if (!initialResponse.ok) {
        this.logger.error(
          `TMDB API error: ${initialResponse.status} ${initialResponse.statusText}`,
        );
        return null;
      }

      const initialData: DiscoverResponse<TMDBMovie> =
        await initialResponse.json();
      const totalPages = Math.min(initialData.total_pages, 500); // TMDB limits to 500 pages

      if (totalPages === 0 || initialData.results.length === 0) {
        return null;
      }

      // Try up to 10 random pages to find a movie not in excludeTmdbIds
      const maxAttempts = 10;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const randomPage = Math.floor(Math.random() * totalPages) + 1;
        params.set("page", randomPage.toString());

        const response = await fetch(
          `${this.baseUrl}/discover/movie?${params.toString()}`,
        );

        if (!response.ok) {
          continue;
        }

        const data: DiscoverResponse<TMDBMovie> = await response.json();

        // Filter out already swiped movies
        const availableMovies = data.results.filter(
          movie => !excludeTmdbIds.includes(movie.id),
        );

        if (availableMovies.length > 0) {
          // Return a random movie from the available ones
          const randomIndex = Math.floor(
            Math.random() * availableMovies.length,
          );
          return availableMovies[randomIndex];
        }
      }

      this.logger.warn("Could not find unswiped movie after max attempts");
      return null;
    } catch (error) {
      this.logger.error("Error discovering movies", error);
      return null;
    }
  }

  /**
   * Discover TV shows with filters
   */
  async discoverTVShows(
    filters: DiscoverFilters,
    excludeTmdbIds: number[] = [],
  ): Promise<TMDBTVShow | null> {
    try {
      const params = new URLSearchParams({
        api_key: this.apiKey,
        language: "en-US",
        sort_by: "popularity.desc",
        include_adult: "false",
      });

      if (filters.genreIds && filters.genreIds.length > 0) {
        params.append("with_genres", filters.genreIds.join(","));
      }

      if (filters.yearMin) {
        params.append("first_air_date.gte", `${filters.yearMin}-01-01`);
      }

      if (filters.yearMax) {
        params.append("first_air_date.lte", `${filters.yearMax}-12-31`);
      }

      // First, get total pages to select a random page
      const initialResponse = await fetch(
        `${this.baseUrl}/discover/tv?${params.toString()}`,
      );

      if (!initialResponse.ok) {
        this.logger.error(
          `TMDB API error: ${initialResponse.status} ${initialResponse.statusText}`,
        );
        return null;
      }

      const initialData: DiscoverResponse<TMDBTVShow> =
        await initialResponse.json();
      const totalPages = Math.min(initialData.total_pages, 500); // TMDB limits to 500 pages

      if (totalPages === 0 || initialData.results.length === 0) {
        return null;
      }

      // Try up to 10 random pages to find a TV show not in excludeTmdbIds
      const maxAttempts = 10;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const randomPage = Math.floor(Math.random() * totalPages) + 1;
        params.set("page", randomPage.toString());

        const response = await fetch(
          `${this.baseUrl}/discover/tv?${params.toString()}`,
        );

        if (!response.ok) {
          continue;
        }

        const data: DiscoverResponse<TMDBTVShow> = await response.json();

        // Filter out already swiped TV shows
        const availableShows = data.results.filter(
          show => !excludeTmdbIds.includes(show.id),
        );

        if (availableShows.length > 0) {
          // Return a random show from the available ones
          const randomIndex = Math.floor(Math.random() * availableShows.length);
          return availableShows[randomIndex];
        }
      }

      this.logger.warn("Could not find unswiped TV show after max attempts");
      return null;
    } catch (error) {
      this.logger.error("Error discovering TV shows", error);
      return null;
    }
  }

  /**
   * Get movie genres (cached)
   */
  async getMovieGenres(): Promise<Genre[]> {
    if (this.movieGenresCache) {
      return this.movieGenresCache;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/genre/movie/list?api_key=${this.apiKey}&language=en-US`,
      );

      if (!response.ok) {
        this.logger.error("Failed to fetch movie genres");
        return [];
      }

      const data: GenreResponse = await response.json();
      this.movieGenresCache = data.genres;
      return data.genres;
    } catch (error) {
      this.logger.error("Error fetching movie genres", error);
      return [];
    }
  }

  /**
   * Get TV genres (cached)
   */
  async getTVGenres(): Promise<Genre[]> {
    if (this.tvGenresCache) {
      return this.tvGenresCache;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/genre/tv/list?api_key=${this.apiKey}&language=en-US`,
      );

      if (!response.ok) {
        this.logger.error("Failed to fetch TV genres");
        return [];
      }

      const data: GenreResponse = await response.json();
      this.tvGenresCache = data.genres;
      return data.genres;
    } catch (error) {
      this.logger.error("Error fetching TV genres", error);
      return [];
    }
  }
}
