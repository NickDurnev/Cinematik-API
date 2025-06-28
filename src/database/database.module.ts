import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DATABASE_CONNECTION } from "./database.connection";
import { DrizzleProvider } from "./drizzle.provider";

@Module({
  imports: [ConfigModule],
  providers: [DrizzleProvider],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
