import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

class GetMoviesDto {
  @ApiProperty({
    description: "Page number for pagination",
    example: "1",
    required: true,
  })
  @IsString()
  page: string;

  @ApiProperty({
    description: "Movie category",
    example: "favorites",
    required: true,
  })
  @IsString()
  category: "favorites" | "watched";
}

export default GetMoviesDto;
