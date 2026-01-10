import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SendPairRequestDto {
  @ApiProperty({
    description:
      "Username of the user to invite (either username or email required)",
    example: "john_doe",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username?: string;

  @ApiProperty({
    description:
      "Email of the user to invite (either username or email required)",
    example: "john@example.com",
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
