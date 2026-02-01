import { randomBytes } from "crypto";

import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

import UsersRepository from "@/auth/user.repository";

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  generateToken(expiresInHours = 24): { token: string; expiresAt: Date } {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    return { token, expiresAt };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.debug("Running token cleanup cron job");
    await this.cleanupExpiredTokens();
  }

  async cleanupExpiredTokens(): Promise<void> {
    try {
      await this.usersRepository.deleteExpiredTokens();
      this.logger.log("Expired tokens cleaned up successfully");
    } catch (error) {
      this.logger.error("Error cleaning up expired tokens:", error);
    }
  }
}
