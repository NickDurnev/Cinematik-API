import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { I18nContext, I18nService } from "nestjs-i18n";
import * as bcrypt from "bcrypt";

import { User, users } from "@/auth/schema";
import { DATABASE_CONNECTION } from "@/database/database.connection";

import { UpdateProfileDto } from "./dto";

@Injectable()
class ProfileRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly database: NodePgDatabase,
    private readonly i18n: I18nService,
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
    updateProfileDto: UpdateProfileDto & { email_confirmed?: boolean },
  ): Promise<User> {
    const { name, email, newPassword, email_confirmed } = updateProfileDto;

    let hashedPassword: string | undefined;
    if (newPassword) {
      const salt = await bcrypt.genSalt();
      hashedPassword = await bcrypt.hash(newPassword, salt);
    }

    try {
      const [updatedProfile] = await this.database
        .update(users)
        .set({
          ...(name && { name }),
          ...(email && { email }),
          ...(newPassword && { password: hashedPassword }),
          ...(email_confirmed !== undefined && { email_confirmed }),
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedProfile) {
        throw new Error(
          this.i18n.t("auth.profileNotFound", {
            lang: I18nContext.current().lang,
          }),
        );
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
}

export default ProfileRepository;
