import {
  IsEmail,
  IsName,
  IsPassword,
} from "@/common/decorators/dto.decorators";

export class UpdateProfileDto {
  @IsName()
  name: string;

  @IsEmail()
  email: string;
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
