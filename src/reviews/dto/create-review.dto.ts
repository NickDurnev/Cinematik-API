import { IsString, MaxLength, MinLength } from "class-validator";

class CreateReviewDto {
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  text: string;

  @IsString()
  @MaxLength(5)
  rating: string;
}

export default CreateReviewDto;
