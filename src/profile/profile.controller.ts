import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Patch,
  Post,
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
import { ResponseCode, ResponseWrapper, UserData } from "@/types";
import { buildResponse } from "@/utils/response/response-wrapper";

import { ForgotPasswordDto, ResetPasswordDto, UpdateProfileDto } from "./dto";
import {
  ForgotPasswordApiResponse,
  ForgotPasswordBody,
  GetProfileApiResponse,
  ResetPasswordApiResponse,
  ResetPasswordBody,
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

  @Post('/forgot-password')
  @ApiOperation({ summary: "Request password reset email" })
  @ApiBody(ForgotPasswordBody)
  @ApiResponse(ForgotPasswordApiResponse)
  @ApiResponse({ status: 400, description: "Bad request - invalid email" })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ResponseWrapper<{ success: boolean; message: string }>> {
    const data = await this.profilesService.forgotPassword(forgotPasswordDto.email);
    return buildResponse({ data, code: ResponseCode.OK, message: data.message });
  }

  @Post('/reset-password')
  @ApiOperation({ summary: "Reset password using token" })
  @ApiBody(ResetPasswordBody)
  @ApiResponse(ResetPasswordApiResponse)
  @ApiResponse({ status: 400, description: "Bad request - invalid data" })
  @ApiResponse({ status: 404, description: "Not found - invalid or expired token" })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<ResponseWrapper<{ success: boolean; message: string }>> {
    const data = await this.profilesService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
    return buildResponse({ data, code: ResponseCode.OK, message: data.message });
  }
}

export default ProfileController;
