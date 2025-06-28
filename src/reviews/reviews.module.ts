import { Module } from "@nestjs/common";
import AuthModule from "@/auth/auth.module";
import { DatabaseModule } from "@/database/database.module";
import ReviewsController from "./reviews.controller";
import ReviewsRepository from "./reviews.repository";
import ReviewsService from "./reviews.service";

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewsRepository],
  exports: [ReviewsRepository],
})
export default class ReviewsModule {}
