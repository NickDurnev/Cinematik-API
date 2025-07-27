import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { and, eq, gt, lt } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  PasswordResetToken,
  passwordResetTokens,
  User,
  users,
} from "@/auth/schema";
import { DATABASE_CONNECTION } from "@/database/database.connection";

import { UpdateProfileDto } from "./dto";

@Injectable()
class ProfileRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly database: NodePgDatabase,
  ) {}

  private logger = new Logger("ProfileRepository");

  async getProfile(userId: string): Promise<User> {
    try {
      const profile = await this.database
        .select()
        .from(users)
        .where(eq(users.id, userId));

      return profile[0] || null;
    } catch (error) {
      this.logger.error(`Failed to get profile ${userId}`, error.stack);
      throw new InternalServerErrorException();
    }
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const { name, email } = updateProfileDto;

    try {
      const [updatedProfile] = await this.database
        .update(users)
        .set({
          ...(name && { name }),
          ...(email && { email }),
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedProfile) {
        throw new Error("Profile not found");
      }

      return updatedProfile;
    } catch (error) {
      this.logger.error(
        `Failed to update profile ${userId}. UpdateDto: ${JSON.stringify(UpdateProfileDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async deleteProfile(userId: string): Promise<User> {
    try {
      const [deletedProfile] = await this.database
        .delete(users)
        .where(eq(users.id, userId))
        .returning();

      return deletedProfile;
    } catch (error) {
      this.logger.error(`Failed to delete profile ${userId}`, error.stack);
      throw new InternalServerErrorException();
    }
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

  async findValidPasswordResetToken(
    token: string,
  ): Promise<PasswordResetToken | null> {
    const now = new Date();
    const tokens = await this.database
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, "false"),
          gt(passwordResetTokens.expires_at, now),
        ),
      );
    return tokens[0] || null;
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    await this.database
      .update(passwordResetTokens)
      .set({ used: "true" })
      .where(eq(passwordResetTokens.token, token));
  }
}

export default ProfileRepository;
