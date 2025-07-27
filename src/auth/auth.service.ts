import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

import FormatDataService from "@/common/services/format-data.service";
import { AuthData, TokensData } from "@/types";

import {
  AuthCredentialsDto,
  AuthSignInDto,
  AuthSocialDto,
} from "./dto/auth-credentials.dto";
import { JwtPayload } from "./jwt-payload.interface";
import UsersRepository from "./user.repository";

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
    private formatDataService: FormatDataService,
  ) {}

  async SignUp(authCredentialsDto: AuthCredentialsDto): Promise<AuthData> {
    const existingUser = await this.usersRepository.findByEmail(
      authCredentialsDto.email,
    );

    if (existingUser) {
      throw new ConflictException("User already exists");
    }

    const user =
      await this.usersRepository.createUserByCredentials(authCredentialsDto);

    if (user) {
      const tokens = await this.generateTokens({
        name: user.name,
        email: user.email,
      });

      const userData = await this.formatDataService.formatUserData(user);
      return { tokens, user: userData };
    }

    throw new UnauthorizedException("User already exists");
  }

  async socialLogin(authSocialDto: AuthSocialDto): Promise<AuthData> {
    let user = await this.usersRepository.findByEmail(authSocialDto.email);

    if (!user) {
      user = await this.usersRepository.createUserBySocial(authSocialDto);
      if (!user) {
        throw new UnauthorizedException(
          "Unable to create user with social login",
        );
      }
    }

    const tokens = await this.generateTokens({
      name: user.name,
      email: user.email,
    });

    const userData = await this.formatDataService.formatUserData(user);
    return { tokens, user: userData };
  }

  async SignIn(authSignInDto: AuthSignInDto): Promise<AuthData> {
    const { email, password } = authSignInDto;
    const user = await this.usersRepository.findByEmail(email);

    if (user && password && (await bcrypt.compare(password, user.password))) {
      const tokens = await this.generateTokens({
        name: user.name,
        email: user.email,
      });

      const userData = await this.formatDataService.formatUserData(user);
      return { tokens, user: userData };
    } else {
      throw new UnauthorizedException("Please check your login credentials");
    }
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<Pick<TokensData, "access_token" | "access_token_expires">> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get("JWT_SECRET"),
      });

      // Return time remaining in seconds
      const accessTokenExpires = 60 * 60; // 60 minutes in seconds

      const accessToken: string = await this.jwtService.sign(
        { name: payload.name, email: payload.email },
        { expiresIn: "60m" },
      );
      return {
        access_token: accessToken,
        access_token_expires: accessTokenExpires,
      };
    } catch (_) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  generateTokens = async (payload: JwtPayload): Promise<TokensData> => {
    // Return time remaining in seconds
    const accessTokenExpires = 60 * 60; // 60 minutes in seconds
    const refreshTokenExpires = 7 * 24 * 60 * 60; // 7 days in seconds

    const accessToken: string = await this.jwtService.sign(payload, {
      expiresIn: "60m",
      secret: this.configService.get("JWT_SECRET"),
    });
    const refreshToken: string = await this.jwtService.sign(payload, {
      expiresIn: "7d",
      secret: this.configService.get("JWT_SECRET"),
    });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      access_token_expires: accessTokenExpires,
      refresh_token_expires: refreshTokenExpires,
    };
  };
}
