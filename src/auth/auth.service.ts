import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { TokensData } from "@/types";

import { AuthCredentialsDto, AuthSignInDto } from "./dto/auth-credentials.dto";
import { JwtPayload } from "./jwt-payload.interface";
import { UsersRepository } from "./user.repository";

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async SignUp(authCredentialsDto: AuthCredentialsDto): Promise<TokensData> {
    const user = await this.usersRepository.createUser(authCredentialsDto);

    if (user) {
      const payload: JwtPayload = { name: user.name, email: user.email };

      return this.generateTokens(payload);
    }

    throw new UnauthorizedException("User already exists");
  }

  async SignIn(authSignInDto: AuthSignInDto): Promise<TokensData> {
    const { email, password } = authSignInDto;
    const user = await this.usersRepository.findByEmail(email);

    if (user && password && (await bcrypt.compare(password, user.password))) {
      const payload: JwtPayload = { name: user.name, email: user.email };

      return this.generateTokens(payload);
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
      const accessTokenExpires = 15 * 60; // 15 minutes in seconds

      const accessToken: string = await this.jwtService.sign(
        { name: payload.name, email: payload.email },
        { expiresIn: "15m" },
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
    const accessTokenExpires = 15 * 60; // 15 minutes in seconds
    const refreshTokenExpires = 7 * 24 * 60 * 60; // 7 days in seconds

    const accessToken: string = await this.jwtService.sign(payload, {
      expiresIn: "15m",
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
