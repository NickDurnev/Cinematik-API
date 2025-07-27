import { randomBytes } from "crypto";

import { Injectable, NotFoundException } from "@nestjs/common";

import UsersRepository from "@/auth/user.repository";
import EmailService from "@/common/services/email.service";
import FormatDataService from "@/common/services/format-data.service";
import { UserData } from "@/types";

import { UpdateProfileDto } from "./dto";
import ProfileRepository from "./profile.repository";

@Injectable()
class ReviewsService {
  constructor(
    private profileRepository: ProfileRepository,
    private usersRepository: UsersRepository,
    private formatDataService: FormatDataService,
    private emailService: EmailService,
  ) {}

  async getProfile(userId: string): Promise<UserData> {
    const profile = await this.profileRepository.getProfile(userId);

    const userData = await this.formatDataService.formatUserData(profile);
    return userData;
  }

  async updateProfile(
    id: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserData> {
    const profile = await this.profileRepository.updateProfile(
      id,
      updateProfileDto,
    );

    const userData = await this.formatDataService.formatUserData(profile);
    return userData;
  }

  async deleteProfile(id: string): Promise<void> {
    await this.profileRepository.deleteProfile(id);
  }

  async forgotPassword(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Find user by email
      const user = await this.usersRepository.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return {
          success: true,
          message:
            "If an account with that email exists, a password reset link has been sent.",
        };
      }

      // Generate reset token
      const resetToken = this.generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Save reset token to database
      await this.profileRepository.createPasswordResetToken(
        user.id,
        resetToken,
        expiresAt,
      );

      // Create reset link
      const resetLink = `${process.env.CLIENT_APP_BASE_URL}/reset-password?token=${resetToken}`;

      // Send email
      const emailResponse = await this.emailService.sendForgotPasswordEmail(
        user,
        resetLink,
      );

      if (!emailResponse.data.id) {
        throw new Error("Failed to send password reset email");
      }

      return {
        success: true,
        message: "Password reset email sent successfully.",
      };
    } catch (error) {
      console.error("Error sending forgot password email:", error);
      throw new Error("Failed to send password reset email");
    }
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Find valid reset token
      const resetToken =
        await this.profileRepository.findValidPasswordResetToken(token);
      if (!resetToken) {
        throw new NotFoundException("Invalid or expired reset token");
      }

      // Update user password
      await this.profileRepository.updateUserPassword(
        resetToken.user_id,
        newPassword,
      );

      // Mark token as used
      await this.profileRepository.markPasswordResetTokenAsUsed(token);

      return { success: true, message: "Password reset successfully." };
    } catch (error) {
      console.error("Error resetting password:", error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error("Failed to reset password");
    }
  }

  async cleanupExpiredTokens(): Promise<void> {
    try {
      await this.profileRepository.deleteExpiredPasswordResetTokens();
    } catch (error) {
      console.error("Error cleaning up expired tokens:", error);
    }
  }

  private generateResetToken(): string {
    return randomBytes(32).toString("hex");
  }
}

export default ReviewsService;
