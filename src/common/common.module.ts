import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import UsersRepository from "@/auth/user.repository";
import DatabaseModule from "@/database/database.module";
import ReviewsRepository from "@/reviews/reviews.repository";

import EmailService from "./services/email.service";
import FormatDataService from "./services/format-data.service";
import { TMDBService } from "./services/tmdb.service";
import { TokenService } from "./services/token.service";

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [
    FormatDataService,
    ReviewsRepository,
    EmailService,
    TokenService,
    UsersRepository,
    TMDBService,
  ],
  exports: [
    FormatDataService,
    EmailService,
    TokenService,
    UsersRepository,
    TMDBService,
  ],
})
export class CommonModule {}
