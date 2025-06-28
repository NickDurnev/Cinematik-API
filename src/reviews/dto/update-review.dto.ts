import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

class UpdateReviewDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  rating?: string;
}

export default UpdateReviewDto;
