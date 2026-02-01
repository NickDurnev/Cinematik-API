import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsInt,
  IsOptional,
  Min,
  Max,
  ArrayMinSize,
} from "class-validator";

export class ProposeFiltersDto {
  @ApiProperty({
    description: "Minimum year for content release",
    example: 2000,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  yearMin?: number;

  @ApiProperty({
    description: "Maximum year for content release",
    example: 2024,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  yearMax?: number;

  @ApiProperty({
    description: "Array of genre IDs to filter by",
    example: [28, 12, 878],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  genreIds?: number[];
}
