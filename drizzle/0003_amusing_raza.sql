ALTER TABLE "user" ADD COLUMN "password" varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;