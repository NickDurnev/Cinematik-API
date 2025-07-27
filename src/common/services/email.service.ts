import { readFileSync } from "fs";
import { join } from "path";

import { Injectable } from "@nestjs/common";
import Handlebars from "handlebars";
import { CreateEmailResponse, Resend } from "resend";

import { User } from "@/auth/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

@Injectable()
export class EmailService {
  private forgotPasswordTemplate: Handlebars.TemplateDelegate;

  constructor() {
    // Load and compile the HTML templates once at service initialization
    const templateSource = readFileSync(
      join(__dirname, "templates/forgot-password-email.html"),
      "utf8",
    );
    const stylesSource = readFileSync(
      join(__dirname, "templates/email-styles.hbs"),
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

    // Send email using Resend
    return await resend.emails.send({
      from: "Cinematik <noreply@cinematik.com>",
      to: [user.email],
      subject: "Reset Your Password - Cinematik",
      html: htmlContent,
    });
  }
}

export default EmailService;
