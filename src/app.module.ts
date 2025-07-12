import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AppController } from "@/app.controller";
import AuthModule from "@/auth/auth.module";
import { configValidationSchema } from "@/config.schema";
import DatabaseModule from "@/database/database.module";
import ReviewsModule from "@/reviews/reviews.module";

import ProfileModule from "./profile/profile.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env.stage.${process.env.STAGE}`],
      validate: config => {
        return configValidationSchema.parse(config);
      },
    }),
    ReviewsModule,
    AuthModule,
    DatabaseModule,
    ProfileModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
