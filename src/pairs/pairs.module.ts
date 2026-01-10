import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import AuthModule from "@/auth/auth.module";
import { CommonModule } from "@/common/common.module";
import DatabaseModule from "@/database/database.module";

import { PairsController } from "./pairs.controller";
import { PairsGateway } from "./pairs.gateway";
import { PairsRepository } from "./pairs.repository";
import { PairsService } from "./pairs.service";

@Module({
  imports: [AuthModule, DatabaseModule, CommonModule, ScheduleModule.forRoot()],
  controllers: [PairsController],
  providers: [PairsService, PairsRepository, PairsGateway],
  exports: [PairsRepository, PairsGateway],
})
export class PairsModule {}
