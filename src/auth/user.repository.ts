import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { eq, and, gt, lt } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

import { DATABASE_CONNECTION } from "@/database/database.connection";

import { AuthCredentialsDto, AuthSocialDto } from "./dto/auth-credentials.dto";
import { User, users, passwordResetTokens, PasswordResetToken } from "./schema";

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

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    try {
      return (await this.database.insert(passwordResetTokens).values({
        user_id: userId,
        token,
        expires_at: expiresAt,
      }).returning())[0];
    } catch (error) {
      console.error("Database error during password reset token creation:", error);
      throw new InternalServerErrorException("Failed to create password reset token");
    }
  }

  async findValidPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    const now = new Date();
    const tokens = await this.database
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, "false"),
          gt(passwordResetTokens.expires_at, now)
        )
      );
    return tokens[0] || null;
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    await this.database
      .update(passwordResetTokens)
      .set({ used: "true" })
      .where(eq(passwordResetTokens.token, token));
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<User> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    try {
      return (await this.database
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId))
        .returning())[0];
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
}

export default UsersRepository;