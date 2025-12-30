import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { and, eq, gt, lt } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { I18nContext, I18nService } from "nestjs-i18n";

import { DATABASE_CONNECTION } from "@/database/database.connection";

import { AuthCredentialsDto, AuthSocialDto } from "./dto/auth-credentials.dto";
import { User, userTokens, UserToken, users } from "./schema";

@Injectable()
class UsersRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly database: NodePgDatabase,
    private readonly i18n: I18nService,
  ) {}

  async createUserByCredentials(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<User> {
    const { name, password, email } = authCredentialsDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = {
      name,
      password: hashedPassword,
      email,
      picture: "",
    };
    try {
      return (await this.database.insert(users).values(user).returning())[0];
    } catch (error) {
      console.error("Database error during user creation:", error);
      throw new InternalServerErrorException(
        this.i18n.t("auth.createUserFailed", {
          lang: I18nContext.current().lang,
        }),
      );
    }
  }

  async createUserBySocial(authSocialDto: AuthSocialDto): Promise<User> {
    const { name, email, picture } = authSocialDto;

    const user = {
      name,
      email,
      picture,
      email_confirmed: true,
    };
    try {
      return (await this.database.insert(users).values(user).returning())[0];
    } catch (error) {
      console.error("Database error during user creation:", error);
      throw new InternalServerErrorException(
        this.i18n.t("auth.createUserFailed", {
          lang: I18nContext.current().lang,
        }),
      );
    }
  }

  async confirmUserEmail(userId: string): Promise<User> {
    try {
      return (
        await this.database
          .update(users)
          .set({ email_confirmed: true })
          .where(eq(users.id, userId))
          .returning()
      )[0];
    } catch (error) {
      console.error("Database error during email confirmation:", error);
      throw new InternalServerErrorException(
        this.i18n.t("auth.confirmEmailFailed", {
          lang: I18nContext.current().lang,
        }),
      );
    }
  }

  async findByName(name: string) {
    const usersData = await this.database
      .select()
      .from(users)
      .where(eq(users.name, name));
    return usersData[0] || null;
  }

  async findByEmail(email: string) {
    const usersData = await this.database
      .select()
      .from(users)
      .where(eq(users.email, email));
    return usersData[0] || null;
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<User> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    try {
      return (
        await this.database
          .update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, userId))
          .returning()
      )[0];
    } catch (error) {
      console.error("Database error during password update:", error);
      throw new InternalServerErrorException(
        this.i18n.t("auth.updatePasswordFailed", {
          lang: I18nContext.current().lang,
        }),
      );
    }
  }

  async deleteExpiredTokens(): Promise<void> {
    const now = new Date();
    await this.database
      .delete(userTokens)
      .where(lt(userTokens.expires_at, now));
  }

  async createUserToken(
    userId: string,
    token: string,
    type: "email_confirmation" | "reset_password",
    expiresAt: Date,
  ): Promise<UserToken> {
    try {
      return (
        await this.database
          .insert(userTokens)
          .values({
            user_id: userId,
            token,
            type,
            expires_at: expiresAt,
          })
          .returning()
      )[0];
    } catch (error) {
      console.error("Database error during user token creation:", error);
      throw new InternalServerErrorException(
        this.i18n.t("auth.createUserTokenFailed", {
          lang: I18nContext.current().lang,
        }),
      );
    }
  }

  private async findValidTokenByField(
    field: "user_id" | "token",
    value: string,
    type: "email_confirmation" | "reset_password",
  ): Promise<UserToken | null> {
    const now = new Date();
    const fieldCondition =
      field === "user_id"
        ? eq(userTokens.user_id, value)
        : eq(userTokens.token, value);

    const tokens = await this.database
      .select()
      .from(userTokens)
      .where(
        and(
          fieldCondition,
          eq(userTokens.type, type),
          eq(userTokens.used, "false"),
          gt(userTokens.expires_at, now),
        ),
      );
    return tokens[0] || null;
  }

  async findValidTokenByUserId(
    userId: string,
    type: "email_confirmation" | "reset_password",
  ): Promise<UserToken | null> {
    return await this.findValidTokenByField("user_id", userId, type);
  }

  async findValidToken(
    token: string,
    type: "email_confirmation" | "reset_password",
  ): Promise<UserToken | null> {
    return await this.findValidTokenByField("token", token, type);
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await this.database
      .update(userTokens)
      .set({ used: "true" })
      .where(eq(userTokens.token, token));
  }
}

export default UsersRepository;
