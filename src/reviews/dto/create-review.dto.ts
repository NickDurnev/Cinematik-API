import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

class CreateReviewDto {
  @ApiProperty({
    description: "Review text content",
    example: "This movie was absolutely fantastic! Great acting and storyline.",
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  text: string;

  @ApiProperty({
    description: "Review rating (1-5 stars)",
    example: "5",
    maxLength: 5,
  })
  @IsString()
  @MaxLength(5)
  rating: string;
}

export default CreateReviewDto;
