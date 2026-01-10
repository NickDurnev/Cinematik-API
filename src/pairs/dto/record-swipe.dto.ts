import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsInt, IsNotEmpty } from "class-validator";

export enum SwipeDirection {
  LEFT = "left",
  RIGHT = "right",
}

export class RecordSwipeDto {
  @ApiProperty({
    description: "TMDB ID of the content being swiped",
    example: 550,
  })
  @IsInt()
  @IsNotEmpty()
  tmdbId: number;

  @ApiProperty({
    description: "Direction of the swipe",
    enum: SwipeDirection,
    example: SwipeDirection.RIGHT,
  })
  @IsEnum(SwipeDirection)
  @IsNotEmpty()
  direction: SwipeDirection;
}
