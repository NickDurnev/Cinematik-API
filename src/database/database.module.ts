import { Module } from "@nestjs/common";
import { DrizzleProvider } from "./drizzle.provider";

@Module({
  providers: [DrizzleProvider],
  exports: ["DRIZZLE"],
})
export class DatabaseModule {}
