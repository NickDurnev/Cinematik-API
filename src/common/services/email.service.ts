import { randomBytes } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";

import { Injectable, NotFoundException } from "@nestjs/common";
import Handlebars from "handlebars";
import { Resend } from "resend";

import UsersRepository from "@/auth/user.repository";

const resend = new Resend(process.env.RESEND_API_KEY);

@Injectable()
export class EmailService {
  private forgotPasswordTemplate: Handlebars.TemplateDelegate;

  constructor(private usersRepository: UsersRepository) {
    // Load and compile the HTML template once at service initialization
    const templateSource = readFileSync(
      join(__dirname, "forgot-password-email.html"),
      "utf8",
    );
    this.forgotPasswordTemplate = Handlebars.compile(templateSource);
  }

  private generateResetToken(): string {
    return randomBytes(32).toString("hex");
  }

  private createForgotPasswordEmailTemplate(
    userName: string,
    resetLink: string,
  ): string {
    return this.forgotPasswordTemplate({ userName, resetLink });
  }

  async sendForgotPasswordEmail(
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
      await this.usersRepository.createPasswordResetToken(
        user.id,
        resetToken,
        expiresAt,
      );

      // Create reset link
      const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

      // Create email template
      const htmlContent = this.createForgotPasswordEmailTemplate(
        user.name,
        resetLink,
      );

      // Send email using Resend
      await resend.emails.send({
        from: "Cinematik <noreply@cinematik.com>",
        to: [email],
        subject: "Reset Your Password - Cinematik",
        html: htmlContent,
      });

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
        await this.usersRepository.findValidPasswordResetToken(token);
      if (!resetToken) {
        throw new NotFoundException("Invalid or expired reset token");
      }

      // Update user password
      await this.usersRepository.updateUserPassword(
        resetToken.user_id,
        newPassword,
      );

      // Mark token as used
      await this.usersRepository.markPasswordResetTokenAsUsed(token);

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
      await this.usersRepository.deleteExpiredPasswordResetTokens();
    } catch (error) {
      console.error("Error cleaning up expired tokens:", error);
    }
  }
}

export default EmailService;
