import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { I18n, I18nContext, I18nService } from "nestjs-i18n";

import EmailService from "@/common/services/email.service";
import FormatDataService from "@/common/services/format-data.service";
import { TokenService } from "@/common/services/token.service";
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
    private tokenService: TokenService,
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
      // Generate confirmation token
      const { token: confirmationToken, expiresAt } =
        this.tokenService.generateToken(24);

      // Save confirmation token to database
      await this.usersRepository.createUserToken(
        user.id,
        confirmationToken,
        "email_confirmation",
        expiresAt,
      );

      // Create confirmation link
      const confirmationLink = `${this.configService.get("CLIENT_APP_BASE_URL")}/confirm-email?token=${confirmationToken}`;

      // Send email
      await this.emailService.sendConfirmEmail(user, confirmationLink, true);

      const tokens = await this.generateTokens({
        id: user.id,
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
      id: user.id,
      name: user.name,
      email: user.email,
    });

    const userData = await this.formatDataService.formatUserData(user);
    return { tokens, user: userData };
  }

  async SignIn(
    authSignInDto: AuthSignInDto,
    @I18n() i18n: I18nService,
  ): Promise<AuthData> {
    const { email, password } = authSignInDto;
    const user = await this.usersRepository.findByEmail(email);

    if (user && password && (await bcrypt.compare(password, user.password))) {
      if (!user.email_confirmed) {
        throw new UnauthorizedException(
          this.i18n.t("auth.emailNotConfirmed", {
            lang: I18nContext.current().lang,
          }),
        );
      }

      const tokens = await this.generateTokens({
        id: user.id,
        name: user.name,
        email: user.email,
      });

      const userData = await this.formatDataService.formatUserData(user);
      return { tokens, user: userData };
    } else {
      throw new UnauthorizedException(i18n.t("auth.invalidLoginCredentials"));
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
        {
          id: payload.id,
          name: payload.name,
          email: payload.email,
        },
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

    const userActiveToken = await this.usersRepository.findValidTokenByUserId(
      user.id,
      "reset_password",
    );

    if (userActiveToken?.id) {
      throw new ConflictException(
        this.i18n.t("auth.userReceivedPasswordResetEmail", {
          lang: I18nContext.current().lang,
        }),
      );
    }

    // Generate reset token
    const { token: resetToken, expiresAt } = this.tokenService.generateToken(1);

    // Save reset token to database
    await this.usersRepository.createUserToken(
      user.id,
      resetToken,
      "reset_password",
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
    const resetToken = await this.usersRepository.findValidToken(
      token,
      "reset_password",
    );
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
    await this.usersRepository.markTokenAsUsed(token);

    return {
      success: true,
      message: this.i18n.t("auth.resetPasswordSuccessMessage", {
        lang: I18nContext.current().lang,
      }),
    };
  }

  async confirmEmail(
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    // Find valid confirmation token
    const confirmationToken = await this.usersRepository.findValidToken(
      token,
      "email_confirmation",
    );
    if (!confirmationToken) {
      throw new NotFoundException(
        this.i18n.t("auth.invalidConfirmationToken", {
          lang: I18nContext.current().lang,
        }),
      );
    }

    // Confirm user email
    await this.usersRepository.confirmUserEmail(confirmationToken.user_id);

    // Mark token as used
    await this.usersRepository.markTokenAsUsed(token);

    return {
      success: true,
      message: this.i18n.t("auth.emailConfirmedSuccessfully", {
        lang: I18nContext.current().lang,
      }),
    };
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.tokenService.cleanupExpiredTokens();
  }
}
