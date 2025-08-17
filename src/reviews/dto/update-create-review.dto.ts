import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export abstract class BaseReviewDto {
  @ApiProperty({
    description: "Review text content",
    example: "This movie was absolutely fantastic! Great acting and storyline.",
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  text?: string;

  @ApiProperty({
    description: "Review rating (1-5 stars)",
    example: "5",
    maxLength: 5,
  })
  @IsString()
  @MaxLength(5)
  rating?: string;
}

export class CreateReviewDto extends BaseReviewDto {
  @ApiProperty({ required: true })
  override text!: string;

  @ApiProperty({ required: true })
  override rating!: string;
}

export class UpdateReviewDto extends BaseReviewDto {
  @IsOptional()
  @ApiProperty({ required: false })
  override text?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  override rating?: string;
}
