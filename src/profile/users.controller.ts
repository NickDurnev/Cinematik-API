import { Controller, Get, Logger, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { ResponseWrapper, UserData } from "@/types";
import { buildResponse } from "@/utils/response/response-wrapper";

import ProfileService from "./profile.service";

@ApiBearerAuth()
@ApiTags("Users")
@Controller("users")
@UseGuards(AuthGuard())
class UsersController {
  private logger = new Logger("UsersController");

  constructor(private profileService: ProfileService) {}

  @Get("search")
  @ApiOperation({ summary: "Search users by name" })
  @ApiQuery({
    name: "query",
    required: true,
    description: "Search query string",
  })
  @ApiResponse({
    status: 200,
    description: "Users found",
  })
  async searchUsers(
    @Query("query") query: string,
  ): Promise<ResponseWrapper<UserData[]>> {
    this.logger.verbose(`Searching users with query: "${query}"`);
    const data = await this.profileService.searchUsers(query);
    return buildResponse({ data });
  }
}

export default UsersController;
