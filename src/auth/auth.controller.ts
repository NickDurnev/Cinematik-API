import { Body, Controller, Post } from "@nestjs/common";
import { TokensData } from "@/types";
import { AuthService } from "./auth.service";
import { AuthCredentialsDto, AuthSignInDto } from "./dto/auth-credentials.dto";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  signUp(@Body() authCredentialsDto: AuthCredentialsDto): Promise<TokensData> {
    return this.authService.SignUp(authCredentialsDto);
  }

  @Post('/signin')
  signIn(
    @Body() authSignInDto: AuthSignInDto,
  ): Promise<TokensData> {
    return this.authService.SignIn(authSignInDto);
  }

  @Post('/refresh')
  refresh(
    @Body('refreshToken') refreshToken: string,
  ): Promise<Pick<TokensData, "access_token" | "access_token_expires">> {
    return this.authService.refreshAccessToken(refreshToken);
  }
}
