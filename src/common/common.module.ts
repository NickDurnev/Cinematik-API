import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import DatabaseModule from "@/database/database.module";
import ReviewsRepository from "@/reviews/reviews.repository";
import UsersRepository from "@/auth/user.repository";

import EmailService from "./services/email.service";
import FormatDataService from "./services/format-data.service";
import { TokenService } from "./services/token.service";

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [
    FormatDataService,
    ReviewsRepository,
    EmailService,
    TokenService,
    UsersRepository,
  ],
  exports: [FormatDataService, EmailService, TokenService, UsersRepository],
})
export class CommonModule {}
