import { readFileSync } from "fs";
import { join } from "path";

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Handlebars from "handlebars";
import { CreateEmailResponse, Resend } from "resend";

import { User } from "@/auth/schema";

@Injectable()
export class EmailService {
  private forgotPasswordTemplate: Handlebars.TemplateDelegate;
  private confirmEmailTemplate: Handlebars.TemplateDelegate;

  constructor(private configService: ConfigService) {
    const templatesDir = join(process.cwd(), "src/common/templates");

    // Load and compile the HTML templates once at service initialization
    const forgotPasswordSource = readFileSync(
      join(templatesDir, "forgot-password-email.html"),
      "utf8",
    );
    const confirmEmailSource = readFileSync(
      join(templatesDir, "confirm-email.html"),
      "utf8",
    );
    const stylesSource = readFileSync(
      join(templatesDir, "email-styles.hbs"),
      "utf8",
    );
    const headerSource = readFileSync(join(templatesDir, "header.hbs"), "utf8");
    const footerSource = readFileSync(join(templatesDir, "footer.hbs"), "utf8");

    Handlebars.registerPartial("styles", stylesSource);
    Handlebars.registerPartial("header", headerSource);
    Handlebars.registerPartial("footer", footerSource);

    this.forgotPasswordTemplate = Handlebars.compile(forgotPasswordSource);
    this.confirmEmailTemplate = Handlebars.compile(confirmEmailSource);
  }

  async sendForgotPasswordEmail(
    user: User,
    resetLink: string,
  ): Promise<CreateEmailResponse> {
    // Create email template
    const htmlContent = this.forgotPasswordTemplate({
      userName: user.name,
      resetLink,
    });

    const resend = new Resend(this.configService.get("RESEND_API_KEY"));

    // Send email using Resend
    return await resend.emails.send({
      from: "Cinematik <noreply@bomberman.click>",
      to: [user.email],
      subject: "Reset Your Password - Cinematik",
      html: htmlContent,
    });
  }

  async sendConfirmEmail(
    user: User,
    confirmationLink: string,
    isNewAccount = true,
  ): Promise<CreateEmailResponse> {
    // Create email template
    const htmlContent = this.confirmEmailTemplate({
      userName: user.name,
      confirmationLink,
      isNewAccount,
    });

    const resend = new Resend(this.configService.get("RESEND_API_KEY"));

    // Send email using Resend
    return await resend.emails.send({
      from: "Cinematik <noreply@bomberman.click>",
      to: [user.email],
      subject: "Confirm Your Email - Cinematik",
      html: htmlContent,
    });
  }
}

export default EmailService;
