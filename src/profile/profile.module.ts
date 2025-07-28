import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import AuthModule from "@/auth/auth.module";
import { CommonModule } from "@/common/common.module";
import DatabaseModule from "@/database/database.module";

import ProfileController from "./profile.controller";
import ProfilesRepository from "./profile.repository";
import ProfilesService from "./profile.service";

@Module({
  imports: [AuthModule, DatabaseModule, CommonModule, ConfigModule],
  controllers: [ProfileController],
  providers: [ProfilesService, ProfilesRepository],
  exports: [ProfilesRepository],
})
export default class ReviewsModule {}
