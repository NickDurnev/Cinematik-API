import { Body, Controller, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { AuthData, ResponseCode, ResponseWrapper, TokensData } from "@/types";
import { buildResponse } from "@/utils/response/response-wrapper";

import {
  ForgotPasswordApiResponse,
  ForgotPasswordBody,
  RefreshTokenApiBody,
  RefreshTokenApiResponse,
  ResetPasswordApiResponse,
  ResetPasswordBody,
  SignInApiBody,
  SignInApiResponse,
  SignUpApiBody,
  SignUpApiResponse,
  SocialLoginApiBody,
} from "./auth.docs";
import { AuthService } from "./auth.service";
import {
  AuthCredentialsDto,
  AuthSignInDto,
  AuthSocialDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "./dto/auth-credentials.dto";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  @ApiOperation({ summary: "Sign up new user" })
  @ApiBody(SignUpApiBody)
  @ApiResponse(SignUpApiResponse)
  @ApiResponse({ status: 400, description: "Bad request - invalid data" })
  @ApiResponse({ status: 409, description: "Conflict - user already exists" })
  async signUp(
    @Body() authCredentialsDto: AuthCredentialsDto,
  ): Promise<ResponseWrapper<AuthData>> {
    const data = await this.authService.SignUp(authCredentialsDto);
    return buildResponse({data, code: ResponseCode.OK, message: "User signed up successfully"});
  }

  @Post('/signin')
  @ApiOperation({ summary: "Sign in existing user" })
  @ApiBody(SignInApiBody)
  @ApiResponse(SignInApiResponse)
  @ApiResponse({ status: 400, description: "Bad request - invalid credentials" })
  @ApiResponse({ status: 401, description: "Unauthorized - invalid credentials" })
  async signIn(
    @Body() authSignInDto: AuthSignInDto,
  ): Promise<ResponseWrapper<AuthData>> {
    const data = await this.authService.SignIn(authSignInDto);
    return buildResponse({data,code: ResponseCode.OK, message: "User signed in"});  
  }

  @Post('/social')
  @ApiOperation({ summary: "Social login (Google, Facebook, etc.)" })
  @ApiBody(SocialLoginApiBody)
  @ApiResponse(SignUpApiResponse)
  @ApiResponse({ status: 400, description: "Bad request - invalid data" })
  async socialLogin(
    @Body() authSocialDto: AuthSocialDto,
  ): Promise<ResponseWrapper<AuthData>> {
    const data = await this.authService.socialLogin(authSocialDto);
    return buildResponse({data, code: ResponseCode.OK, message: "User logged in via social"});
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
    @Body('refresh_token') refreshToken: string,
  ): Promise<ResponseWrapper<Pick<TokensData, "access_token" | "access_token_expires">>> {
    const data = await this.authService.refreshAccessToken(refreshToken);
    return buildResponse({data, code:ResponseCode.OK, message:"Access token refreshed"});
  }

  @Post('/forgot-password')
  @ApiOperation({ summary: "Request password reset email" })
  @ApiBody(ForgotPasswordBody)
  @ApiResponse(ForgotPasswordApiResponse)
  @ApiResponse({ status: 400, description: "Bad request - invalid email" })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ResponseWrapper<{ success: boolean; message: string }>> {
    const data = await this.authService.forgotPassword(forgotPasswordDto.email);
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
    const data = await this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
    return buildResponse({ data, code: ResponseCode.OK, message: data.message });
  }
}
