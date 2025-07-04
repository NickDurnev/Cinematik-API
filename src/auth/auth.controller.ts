import { Body, Controller, Post } from "@nestjs/common";

import { ResponseCode, ResponseWrapper,TokensData } from "@/types";
import { buildResponse } from "@/utils/response/response-wrapper";

import { AuthService } from "./auth.service";
import { AuthCredentialsDto, AuthSignInDto } from "./dto/auth-credentials.dto";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  async signUp(@Body() authCredentialsDto: AuthCredentialsDto): Promise<ResponseWrapper<TokensData>> {
  const tokens = await this.authService.SignUp(authCredentialsDto);
  return buildResponse(tokens, ResponseCode.CREATED, "User signed up", "success");  
}

  @Post('/signin')
  async signIn(
    @Body() authSignInDto: AuthSignInDto,
  ): Promise<ResponseWrapper<TokensData>> {
    const tokens = await this.authService.SignIn(authSignInDto);
    return buildResponse(tokens, ResponseCode.CREATED, "User signed in", "success");  
  }

  @Post('/refresh')
  async refresh(
    @Body('refreshToken') refreshToken: string,
  ): Promise<ResponseWrapper<Pick<TokensData, "access_token" | "access_token_expires">>> {
    const tokens = await this.authService.refreshAccessToken(refreshToken);
    return buildResponse(tokens, ResponseCode.CREATED, "Access token refreshed", "success");
  }
}
