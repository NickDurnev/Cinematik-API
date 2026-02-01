import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";

export enum PairRequestAction {
  ACCEPT = "accept",
  REJECT = "reject",
}

export class RespondPairRequestDto {
  @ApiProperty({
    description: "Action to take on the pair request",
    enum: PairRequestAction,
    example: PairRequestAction.ACCEPT,
  })
  @IsEnum(PairRequestAction)
  @IsNotEmpty()
  action: PairRequestAction;
}
