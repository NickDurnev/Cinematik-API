import { IsString } from "class-validator";

class GetReviewsDto {
  @IsString()
  page: string;
}

export default GetReviewsDto;
