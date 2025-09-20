import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { and, eq, gt, lt } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

import { DATABASE_CONNECTION } from "@/database/database.connection";

import { AuthCredentialsDto, AuthSocialDto } from "./dto/auth-credentials.dto";
import { PasswordResetToken, passwordResetTokens, User, users } from "./schema";

@Injectable()
class UsersRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly database: NodePgDatabase,
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
      throw new InternalServerErrorException("Failed to create user");
    }
  }

  async createUserBySocial(authSocialDto: AuthSocialDto): Promise<User> {
    const { name, email, picture } = authSocialDto;

    const user = {
      name,
      email,
      picture,
    };
    try {
      return (await this.database.insert(users).values(user).returning())[0];
    } catch (error) {
      console.error("Database error during user creation:", error);
      throw new InternalServerErrorException("Failed to create user");
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
      throw new InternalServerErrorException("Failed to update password");
    }
  }

  async deleteExpiredPasswordResetTokens(): Promise<void> {
    const now = new Date();
    await this.database
      .delete(passwordResetTokens)
      .where(lt(passwordResetTokens.expires_at, now));
  }

  async createPasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<PasswordResetToken> {
    try {
      return (
        await this.database
          .insert(passwordResetTokens)
          .values({
            user_id: userId,
            token,
            expires_at: expiresAt,
          })
          .returning()
      )[0];
    } catch (error) {
      console.error(
        "Database error during password reset token creation:",
        error,
      );
      throw new InternalServerErrorException(
        "Failed to create password reset token",
      );
    }
  }

  private async findValidPasswordResetTokenByField(
    field: "user_id" | "token",
    value: string,
  ): Promise<PasswordResetToken | null> {
    const now = new Date();
    const fieldCondition =
      field === "user_id"
        ? eq(passwordResetTokens.user_id, value)
        : eq(passwordResetTokens.token, value);

    const tokens = await this.database
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          fieldCondition,
          eq(passwordResetTokens.used, "false"),
          gt(passwordResetTokens.expires_at, now),
        ),
      );
    return tokens[0] || null;
  }

  async findValidPasswordResetTokenByUserId(
    userId: string,
  ): Promise<PasswordResetToken | null> {
    const res = await this.findValidPasswordResetTokenByField(
      "user_id",
      userId,
    );

    return res;
  }

  async findValidPasswordResetToken(
    token: string,
  ): Promise<PasswordResetToken | null> {
    const res = await this.findValidPasswordResetTokenByField("token", token);

    return res;
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    await this.database
      .update(passwordResetTokens)
      .set({ used: "true" })
      .where(eq(passwordResetTokens.token, token));
  }
}

export default UsersRepository;
