import { randomBytes } from "crypto";

import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { I18nContext, I18nService } from "nestjs-i18n";

import EmailService from "@/common/services/email.service";
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
    private emailService: EmailService,
    private formatDataService: FormatDataService,
    private readonly i18n: I18nService,
  ) {}

  async SignUp(authCredentialsDto: AuthCredentialsDto): Promise<AuthData> {
    const existingUser = await this.usersRepository.findByEmail(
      authCredentialsDto.email,
    );

    if (existingUser) {
      throw new ConflictException(
        this.i18n.t("auth.userExists", {
          lang: I18nContext.current().lang,
        }),
      );
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

    throw new UnauthorizedException(
      this.i18n.t("auth.userExists", {
        lang: I18nContext.current().lang,
      }),
    );
  }

  async socialLogin(authSocialDto: AuthSocialDto): Promise<AuthData> {
    let user = await this.usersRepository.findByEmail(authSocialDto.email);

    if (!user) {
      user = await this.usersRepository.createUserBySocial(authSocialDto);
      if (!user) {
        throw new UnauthorizedException(
          this.i18n.t("auth.socialLoginFailed", {
            lang: I18nContext.current().lang,
          }),
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
      throw new UnauthorizedException(
        this.i18n.t("auth.invalidLoginCredentials", {
          lang: I18nContext.current().lang,
        }),
      );
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
      throw new UnauthorizedException(
        this.i18n.t("auth.invalidRefreshToken", {
          lang: I18nContext.current().lang,
        }),
      );
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

  async forgotPassword(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    // Find user by email
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new NotFoundException(
        this.i18n.t("auth.userNotFound", {
          lang: I18nContext.current().lang,
        }),
      );
    }

    const userActiveToken =
      await this.usersRepository.findValidPasswordResetTokenByUserId(user.id);

    if (userActiveToken?.id) {
      throw new ConflictException(
        this.i18n.t("auth.userReceivedPasswordResetEmail", {
          lang: I18nContext.current().lang,
        }),
      );
    }

    // Generate reset token
    const resetToken = this.generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Save reset token to database
    await this.usersRepository.createPasswordResetToken(
      user.id,
      resetToken,
      expiresAt,
    );

    // Create reset link
    const resetLink = `${this.configService.get("CLIENT_APP_BASE_URL")}/reset-password?token=${resetToken}`;

    // Send email
    const emailResponse = await this.emailService.sendForgotPasswordEmail(
      user,
      resetLink,
    );

    if (!emailResponse.data.id) {
      throw new Error(
        this.i18n.t("auth.passwordResetFailureMessage", {
          lang: I18nContext.current().lang,
        }),
      );
    }

    return {
      success: true,
      message: this.i18n.t("auth.passwordResetSuccessMessage", {
        lang: I18nContext.current().lang,
      }),
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    // Find valid reset token
    const resetToken =
      await this.usersRepository.findValidPasswordResetToken(token);
    if (!resetToken) {
      throw new NotFoundException(
        this.i18n.t("auth.invalidResetToken", {
          lang: I18nContext.current().lang,
        }),
      );
    }

    // Update user password
    await this.usersRepository.updateUserPassword(
      resetToken.user_id,
      newPassword,
    );

    // Mark token as used
    await this.usersRepository.markPasswordResetTokenAsUsed(token);

    return {
      success: true,
      message: this.i18n.t("auth.resetPasswordSuccessMessage", {
        lang: I18nContext.current().lang,
      }),
    };
  }

  async cleanupExpiredTokens(): Promise<void> {
    try {
      await this.usersRepository.deleteExpiredPasswordResetTokens();
    } catch (error) {
      console.error("Error cleaning up expired tokens:", error);
    }
  }

  private generateResetToken(): string {
    return randomBytes(32).toString("hex");
  }
}
