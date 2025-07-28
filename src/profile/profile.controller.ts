import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { GetUser } from "@/auth/get-user.decorator";
import { User } from "@/auth/schema";
import {  UserData } from "@/types";

import {  UpdateProfileDto } from "./dto";
import {
  GetProfileApiResponse,
  UpdateProfileApiBody,
  UpdateProfileApiResponse,
} from "./profile.docs";
import ProfilesService from "./profile.service";

@ApiBearerAuth()
@ApiTags("Profile")
@Controller("profile")
@UseGuards(AuthGuard())
class ProfileController {
  private logger = new Logger("ProfileController");

  constructor(private profilesService: ProfilesService) {}

  @Get()
  @ApiOperation({ summary: "Get profile" })
  @ApiResponse(GetProfileApiResponse)
  getReviews(
    @GetUser() user: User,
  ): Promise<UserData> {
    this.logger.verbose(
      `User "${user.name}" get profile.`,
    );
    return this.profilesService.getProfile(user.id);
  }

  @Patch()
  @ApiOperation({ summary: "Update a profile" })
  @ApiBody(UpdateProfileApiBody)
  @ApiResponse(UpdateProfileApiResponse)
  @ApiResponse({
    status: 404,
    description: "Profile not found",
  })
  updateReviewById(
    @Body() updateProfileDto: UpdateProfileDto,
    @GetUser() user: User,
  ): Promise<UserData> {
    this.logger.verbose(
      `User "${user.name}" updating profile. Data: ${JSON.stringify(
        updateProfileDto,
      )}`,
    );
    return this.profilesService.updateProfile(user.id, updateProfileDto);
  }

  @Delete()
  @ApiOperation({ summary: "Delete a profile" })
  @ApiResponse({
    status: 200,
    description: "Profile deleted successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Profile not found",
  })
  deleteReviewById(
    @GetUser() user: User,
  ): Promise<void> {
    this.logger.verbose(`User "${user.name}" deleting profile`);
    return this.profilesService.deleteProfile(user.id);
  }
}

export default ProfileController;
