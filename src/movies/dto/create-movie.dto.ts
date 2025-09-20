import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

class CreateMovieDto {
  @ApiProperty({
    description: "IDB Movie Identifier",
    example: 49046,
  })
  @IsNumber()
  idb_id: number;

  @ApiProperty({
    description: "Movie poster image URL",
    example: "/hYqOjJ7Gh1fbqXrxlIao1g8ZehF.jpg",
  })
  @IsString()
  @IsOptional()
  poster_path: string;

  @ApiProperty({
    description: "Movie category",
    example: "favorites",
  })
  @IsString()
  category: "favorites" | "watched";

  @ApiProperty({
    description: "Movie title",
    example: "favorites",
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: "Movie title",
    example: "All Quiet on the Western Front",
  })
  @IsString()
  vote_average: number;

  @ApiProperty({
    description: "Genres of the movie",
    example: "[{id: 28, name: 'Action'}, {id: 12, name: 'Adventure'}]",
  })
  @IsArray()
  genres: { id: string; name: string }[];

  @ApiProperty({
    description: "Release date of the movie",
    example: "1939-03-28",
  })
  @MaxLength(10)
  @IsString()
  release_date: string;

  @ApiProperty({
    description: "Tagline of the movie",
    example: "Friendship has evolved.",
  })
  @IsOptional()
  @IsString()
  tagline: string;

  @ApiProperty({
    description: "Runtime of the movie",
    example: 128,
  })
  @IsOptional()
  @IsNumber()
  runtime: number;

  @ApiProperty({
    description: "Budget of the movie",
    example: 1000000,
  })
  @IsOptional()
  @IsNumber()
  budget: number;

  @ApiProperty({
    description: "Overview of the movie",
    example:
      "In the 1930s, the Grand Budapest Hotel is a popular European ski resort, presided over by concierge Gustave H. (Ralph Fiennes). Zero, a junior lobby boy, becomes Gustave's friend and protege.",
  })
  @IsString()
  overview: string;
}

export default CreateMovieDto;
