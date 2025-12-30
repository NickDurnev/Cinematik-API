CREATE TYPE "public"."user_token_type" AS ENUM('email_confirmation', 'reset_password');--> statement-breakpoint
ALTER TABLE "password_reset_tokens" RENAME TO "user_tokens";--> statement-breakpoint
ALTER TABLE "user_tokens" DROP CONSTRAINT "password_reset_tokens_token_unique";--> statement-breakpoint
ALTER TABLE "user_tokens" DROP CONSTRAINT "password_reset_tokens_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_tokens" ADD COLUMN "type" "user_token_type";--> statement-breakpoint
UPDATE "user_tokens" SET "type" = 'reset_password';--> statement-breakpoint
ALTER TABLE "user_tokens" ALTER COLUMN "type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_tokens" ADD CONSTRAINT "user_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tokens" ADD CONSTRAINT "user_tokens_token_unique" UNIQUE("token");