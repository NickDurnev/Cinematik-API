import { Body, Controller, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { ResponseCode, ResponseWrapper, TokensData } from "@/types";
import { buildResponse } from "@/utils/response/response-wrapper";

import {
  RefreshTokenApiBody,
  RefreshTokenApiResponse,
  SignInApiBody,
  SignUpApiBody,
  SignUpApiResponse,
  SocialLoginApiBody,
  TokensApiResponse,
} from "./auth.docs";
import { AuthService } from "./auth.service";
import {
  AuthCredentialsDto,
  AuthSignInDto,
  AuthSocialDto,
} from "./dto/auth-credentials.dto";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  @ApiOperation({ summary: "Sign up a new user" })
  @ApiBody(SignUpApiBody)
  @ApiResponse(SignUpApiResponse)
  @ApiResponse({ status: 400, description: "Bad request - invalid user data" })
  @ApiResponse({ status: 409, description: "Conflict - user already exists" })
  async signUp(@Body() authCredentialsDto: AuthCredentialsDto): Promise<ResponseWrapper<TokensData>> {
    const tokens = await this.authService.SignUp(authCredentialsDto);
    return buildResponse(tokens, ResponseCode.CREATED, "User signed up");  
  }

  @Post('/signin')
  @ApiOperation({ summary: "Sign in existing user" })
  @ApiBody(SignInApiBody)
  @ApiResponse(TokensApiResponse)
  @ApiResponse({ status: 400, description: "Bad request - invalid credentials" })
  @ApiResponse({ status: 401, description: "Unauthorized - invalid credentials" })
  async signIn(
    @Body() authSignInDto: AuthSignInDto,
  ): Promise<ResponseWrapper<TokensData>> {
    const tokens = await this.authService.SignIn(authSignInDto);
    return buildResponse(tokens, ResponseCode.OK, "User signed in");  
  }

  @Post('/social-login')
  @ApiOperation({ summary: "Social login" })
  @ApiBody(SocialLoginApiBody)
  @ApiResponse(TokensApiResponse)
  @ApiResponse({ 
    status: 400, 
    description: "Bad request - invalid data" 
  })
  @ApiResponse({ 
    status: 401, 
    description: "Unauthorized - invalid data" 
  })
  async socialLogin(
    @Body() authSocialDto: AuthSocialDto,
  ): Promise<ResponseWrapper<TokensData>> {
    const tokens = await this.authService.socialLogin(authSocialDto);
    return buildResponse(tokens, ResponseCode.OK, "User signed in");  
  }

  @Post('/refresh')
  @ApiOperation({ summary: "Refresh access token" })
  @ApiBody(RefreshTokenApiBody)
  @ApiResponse(RefreshTokenApiResponse)
  @ApiResponse({ 
    status: 400, 
    description: "Bad request - invalid refresh token" 
  })
  @ApiResponse({ 
    status: 401, 
    description: "Unauthorized - invalid or expired refresh token" 
  })
  async refresh(
    @Body('refreshToken') refreshToken: string,
  ): Promise<ResponseWrapper<Pick<TokensData, "access_token" | "access_token_expires">>> {
    const tokens = await this.authService.refreshAccessToken(refreshToken);
    return buildResponse(tokens, ResponseCode.OK, "Access token refreshed");
  }
}
