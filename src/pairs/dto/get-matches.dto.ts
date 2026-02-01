import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsBoolean } from "class-validator";
import { Transform } from "class-transformer";

import { MediaType } from "./media-type.enum";

export class GetMatchesDto {
  @ApiProperty({
    description: "Filter by media type",
    enum: MediaType,
    required: false,
    example: MediaType.MOVIE,
  })
  @IsOptional()
  @IsEnum(MediaType)
  mediaType?: MediaType;

  @ApiProperty({
    description: "Filter by watched status",
    required: false,
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
    return value;
  })
  @IsBoolean()
  markedWatched?: boolean;
}
