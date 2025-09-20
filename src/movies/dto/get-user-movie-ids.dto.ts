import { ApiProperty } from "@nestjs/swagger";

class GetUserMovieIdsDto {
  @ApiProperty({
    description: "List of user's movie IDB identifiers",
    example: [49046, 550, 603],
    isArray: true,
    type: Number,
  })
  idb_ids: number[];
}

export default GetUserMovieIdsDto;
