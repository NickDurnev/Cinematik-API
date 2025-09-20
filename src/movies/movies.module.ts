import { Module } from "@nestjs/common";

import AuthModule from "@/auth/auth.module";
import DatabaseModule from "@/database/database.module";

import MoviesController from "./movies.controller";
import MoviesRepository from "./movies.repository";
import MoviesService from "./movies.service";

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [MoviesController],
  providers: [MoviesService, MoviesRepository],
  exports: [MoviesRepository],
})
export default class MoviesModule {}
