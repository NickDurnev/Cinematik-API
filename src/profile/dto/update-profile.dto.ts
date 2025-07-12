import { IsEmail, IsName } from "@/common/decorators/dto.decorators";

class UpdateProfileDto {
  @IsName()
  name: string;

  @IsEmail()
  email: string;
}

export default UpdateProfileDto;
