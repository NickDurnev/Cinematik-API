import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class AuthCredentialsDto {
  @ApiProperty({
    description: "User's full name",
    example: "John",
    minLength: 2,
    maxLength: 40,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  name: string;

  @ApiProperty({
    description: "User's password (must be strong)",
    example: "StrongPass123!",
    minLength: 8,
    maxLength: 32,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: "password is too weak",
  })
  password: string;

  @ApiProperty({
    description: "User's email address",
    example: "john.doe@example.com",
  })
  @IsString()
  @Matches(/.+@.+\..+/)
  email: string;
}

export class AuthSocialDto {
  @ApiProperty({
    description: "User's full name",
    example: "John",
    minLength: 4,
    maxLength: 20,
  })
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  name: string;

  @ApiProperty({
    description: "User's email address",
    example: "john.doe@example.com",
  })
  @IsString()
  @Matches(/.+@.+\..+/)
  email: string;

  @ApiProperty({
    description: "User's profile picture URL",
    example: "https://example.com/profile.jpg",
  })
  @IsString()
  @Matches(
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
  )
  picture: string;
}

export class AuthSignInDto {
  @ApiProperty({
    description: "User's email address",
    example: "john.doe@example.com",
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: "User's password",
    example: "StrongPass123!",
    minLength: 8,
    maxLength: 32,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  password: string;
}
