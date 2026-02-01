import { IsOptional } from "class-validator";

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

  @IsPassword()
  @IsOptional()
  newPassword?: string;
}
