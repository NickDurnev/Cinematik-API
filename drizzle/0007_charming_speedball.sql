CREATE TYPE "public"."category" AS ENUM('favorites', 'watched');--> statement-breakpoint
CREATE TABLE "movies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"idb_id" integer NOT NULL,
	"poster_path" varchar(255),
	"category" "category" NOT NULL,
	"title" varchar(255) NOT NULL,
	"vote_average" numeric NOT NULL,
	"genres" jsonb NOT NULL,
	"release_date" varchar(10) NOT NULL,
	"tagline" varchar(255),
	"runtime" integer,
	"budget" integer,
	"overview" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "movies" ADD CONSTRAINT "movies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;