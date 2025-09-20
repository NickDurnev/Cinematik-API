import { applyDecorators } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MaxLength, MinLength } from "class-validator";

// Custom decorator for name property
export const IsName = () =>
  applyDecorators(
    ApiProperty({
      description: "User's full name",
      example: "John",
      minLength: 2,
      maxLength: 20,
    }),
    IsString(),
    MinLength(2),
    MaxLength(20),
  );

// Custom decorator for email property
export const IsEmail = () =>
  applyDecorators(
    ApiProperty({
      description: "User's email address",
      example: "john.doe@example.com",
    }),
    IsString(),
    Matches(/.+@.+\..+/),
  );

// Custom decorator for password property
export const IsPassword = () =>
  applyDecorators(
    ApiProperty({
      description: "User's password (must be strong)",
      example: "StrongPass123!",
      minLength: 8,
      maxLength: 32,
    }),
    IsString(),
    MinLength(8),
    MaxLength(32),
    Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
      message: "password is too weak",
    }),
  );

// Custom decorator for picture URL property
export const IsPictureUrl = () =>
  applyDecorators(
    ApiProperty({
      description: "User's profile picture URL",
      example: "https://example.com/profile.jpg",
    }),
    IsString(),
    Matches(
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
    ),
  );
