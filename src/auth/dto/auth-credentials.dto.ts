import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class AuthCredentialsDto {
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  name: string;

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: "password is too weak",
  })
  password: string;

  @IsString()
  @Matches(/.+@.+\..+/)
  email: string;
}

export class AuthSocialDto {
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  name: string;

  @IsString()
  @Matches(/.+@.+\..+/)
  email: string;

  @IsString()
  @Matches(
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
  )
  picture: string;
}

export class AuthSignInDto {
  @IsString()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  password: string;
}
