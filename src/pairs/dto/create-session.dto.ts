import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";

import { MediaType } from "./media-type.enum";

export class CreateSessionDto {
  @ApiProperty({
    description: "Type of media for this session",
    enum: MediaType,
    example: MediaType.MOVIE,
  })
  @IsEnum(MediaType)
  @IsNotEmpty()
  mediaType: MediaType;
}
