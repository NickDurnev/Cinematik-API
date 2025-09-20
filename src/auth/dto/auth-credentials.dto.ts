import {
  IsEmail,
  IsName,
  IsPassword,
  IsPictureUrl,
} from "@/common/decorators/dto.decorators";

export class AuthCredentialsDto {
  @IsName()
  name: string;

  @IsPassword()
  password: string;

  @IsEmail()
  email: string;
}

export class AuthSocialDto {
  @IsName()
  name: string;

  @IsEmail()
  email: string;

  @IsPictureUrl()
  picture: string;
}

export class AuthSignInDto {
  @IsEmail()
  email: string;

  @IsPassword()
  password: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  token: string;

  @IsPassword()
  newPassword: string;
}
