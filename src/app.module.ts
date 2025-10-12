import { join } from "path";

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HeaderResolver, I18nModule } from "nestjs-i18n";

import { AppController } from "@/app.controller";
import AuthModule from "@/auth/auth.module";
import { configValidationSchema } from "@/config.schema";
import DatabaseModule from "@/database/database.module";
import MoviesModule from "@/movies/movies.module";
import ReviewsModule from "@/reviews/reviews.module";

import ProfileModule from "./profile/profile.module";
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env.stage.${process.env.STAGE || "dev"}`],
      validate: config => {
        return configValidationSchema.parse(config);
      },
    }),
    I18nModule.forRootAsync({
      useFactory: () => ({
        fallbackLanguage: "en",
        loaderOptions: {
          path: join(__dirname, "/i18n/"),
          watch: true,
        },
        typesOutputPath: join(__dirname, "../src/generated/i18n.generated.ts"),
      }),
      resolvers: [new HeaderResolver(["x-custom-lang"])],
    }),
    ReviewsModule,
    MoviesModule,
    AuthModule,
    DatabaseModule,
    ProfileModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
