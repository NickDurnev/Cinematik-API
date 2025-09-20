import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

class GetReviewsDto {
  @ApiProperty({
    description: "Page number for pagination",
    example: "1",
    required: true,
  })
  @IsString()
  page: string;
}

export default GetReviewsDto;
