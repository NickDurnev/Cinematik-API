import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "@/app.controller";
import { AuthModule } from "@/auth/auth.module";
import { configValidationSchema } from "@/config.schema";
import { DatabaseModule } from "@/database/database.module";
import { TasksModule } from "@/tasks/tasks.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env.stage.${process.env.STAGE}`],
      validate: config => {
        return configValidationSchema.parse(config);
      },
    }),
    TasksModule,
    AuthModule,
    DatabaseModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
