import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

class UpdateMovieDto {
  @ApiProperty({
    description: "Movie category",
    example: "favorites",
  })
  @IsString()
  category: "favorites" | "watched";
}

export default UpdateMovieDto;
