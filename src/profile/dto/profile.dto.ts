import { IsEmail, IsName } from "@/common/decorators/dto.decorators";

export class UpdateProfileDto {
  @IsName()
  name: string;

  @IsEmail()
  email: string;
}
