import { Module } from "@nestjs/common";

import DatabaseModule from "@/database/database.module";
import ReviewsRepository from "@/reviews/reviews.repository";

import FormatDataService from "./services/format-data.service";

@Module({
  imports: [DatabaseModule],
  providers: [FormatDataService, ReviewsRepository],
  exports: [FormatDataService],
})
export class CommonModule {}
