import { Body, Controller, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { AuthData, ResponseCode, ResponseWrapper, TokensData } from "@/types";
import { buildResponse } from "@/utils/response/response-wrapper";

import {
  RefreshTokenApiBody,
  RefreshTokenApiResponse,
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
import EmailService from "@/common/services/email.service";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private emailService: EmailService,
  ) {}

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
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          description: 'User email address',
          example: 'user@example.com'
        }
      },
      required: ['email']
    }
  })
  @ApiResponse({
    status: 200,
    description: "Password reset email sent",
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: { type: 'object' },
        code: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: "Bad request - invalid email" })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ResponseWrapper<{ success: boolean; message: string }>> {
    const data = await this.emailService.sendForgotPasswordEmail(forgotPasswordDto.email);
    return buildResponse({ data, code: ResponseCode.OK, message: data.message });
  }

  @Post('/reset-password')
  @ApiOperation({ summary: "Reset password using token" })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'Password reset token from email',
          example: 'abc123def456...'
        },
        newPassword: {
          type: 'string',
          description: 'New password (must be strong)',
          example: 'NewStrongPass123!',
          minLength: 8,
          maxLength: 32
        }
      },
      required: ['token', 'newPassword']
    }
  })
  @ApiResponse({
    status: 200,
    description: "Password reset successfully",
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: { type: 'object' },
        code: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: "Bad request - invalid data" })
  @ApiResponse({ status: 404, description: "Not found - invalid or expired token" })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<ResponseWrapper<{ success: boolean; message: string }>> {
    const data = await this.emailService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
    return buildResponse({ data, code: ResponseCode.OK, message: data.message });
  }
}
