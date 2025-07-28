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

  constructor(private configService: ConfigService) {
    const isProd = this.configService.get("STAGE") === "prod";
    console.log("🚀 ~ isProd:", isProd);

    const templatesDir = isProd
      ? join(__dirname, "common/templates")
      : join(process.cwd(), "src/common/templates");

    // Load and compile the HTML templates once at service initialization
    const templateSource = readFileSync(
      join(templatesDir, "forgot-password-email.html"),
      "utf8",
    );
    const stylesSource = readFileSync(
      join(templatesDir, "email-styles.hbs"),
      "utf8",
    );
    Handlebars.registerPartial("styles", stylesSource);
    this.forgotPasswordTemplate = Handlebars.compile(templateSource);
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
}

export default EmailService;
