import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import AuthModule from "@/auth/auth.module";
import DatabaseModule from "@/database/database.module";
import { CommonModule } from "@/common/common.module";

import { PairsController } from "./pairs.controller";
import { PairsService } from "./pairs.service";
import { PairsRepository } from "./pairs.repository";

@Module({
  imports: [AuthModule, DatabaseModule, CommonModule, ScheduleModule.forRoot()],
  controllers: [PairsController],
  providers: [PairsService, PairsRepository],
  exports: [PairsRepository],
})
export class PairsModule {}
