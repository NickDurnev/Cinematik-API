import { Body, Controller, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { ResponseCode, ResponseWrapper, TokensData } from "@/types";
import { buildResponse } from "@/utils/response/response-wrapper";

import { AuthService } from "./auth.service";
import { AuthCredentialsDto, AuthSignInDto } from "./dto/auth-credentials.dto";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  @ApiOperation({ summary: "Sign up a new user" })
  @ApiBody({ 
    type: AuthCredentialsDto,
    description: "User registration data"
  })
  @ApiResponse({ 
    status: 201, 
    description: "User signed up successfully",
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            access_token_expires: { type: 'string' },
            refresh_token: { type: 'string' },
            refresh_token_expires: { type: 'string' }
          }
        },
        code: { type: 'string' },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: "Bad request - invalid user data" 
  })
  @ApiResponse({ 
    status: 409, 
    description: "Conflict - user already exists" 
  })
  async signUp(@Body() authCredentialsDto: AuthCredentialsDto): Promise<ResponseWrapper<TokensData>> {
    const tokens = await this.authService.SignUp(authCredentialsDto);
    return buildResponse(tokens, ResponseCode.CREATED, "User signed up");  
  }

  @Post('/signin')
  @ApiOperation({ summary: "Sign in existing user" })
  @ApiBody({ 
    type: AuthSignInDto,
    description: "User login credentials"
  })
  @ApiResponse({ 
    status: 200, 
    description: "User signed in successfully",
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            access_token_expires: { type: 'string' },
            refresh_token: { type: 'string' },
            refresh_token_expires: { type: 'string' }
          }
        },
        code: { type: 'string' },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: "Bad request - invalid credentials" 
  })
  @ApiResponse({ 
    status: 401, 
    description: "Unauthorized - invalid credentials" 
  })
  async signIn(
    @Body() authSignInDto: AuthSignInDto,
  ): Promise<ResponseWrapper<TokensData>> {
    const tokens = await this.authService.SignIn(authSignInDto);
    return buildResponse(tokens, ResponseCode.OK, "User signed in");  
  }

  @Post('/refresh')
  @ApiOperation({ summary: "Refresh access token" })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        refreshToken: { 
          type: 'string',
          description: 'Refresh token to generate new access token'
        }
      },
      required: ['refreshToken']
    },
    description: "Refresh token data"
  })
  @ApiResponse({ 
    status: 200, 
    description: "Access token refreshed successfully",
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            access_token_expires: { type: 'string' }
          }
        },
        code: { type: 'string' },
        message: { type: 'string' }
      }
    }
  })
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
