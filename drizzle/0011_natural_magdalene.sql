CREATE TYPE "public"."media_type" AS ENUM('movie', 'tv');--> statement-breakpoint
CREATE TYPE "public"."pair_request_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('filter_pending', 'active', 'completed');--> statement-breakpoint
CREATE TYPE "public"."swipe_direction" AS ENUM('left', 'right');--> statement-breakpoint
CREATE TABLE "pair_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pair_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"tmdb_id" integer NOT NULL,
	"media_type" "media_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"poster_path" varchar(255),
	"overview" varchar(1000),
	"matched_at" timestamp DEFAULT now() NOT NULL,
	"marked_watched" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pair_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"requested_id" uuid NOT NULL,
	"status" "pair_request_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pair_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pair_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"media_type" "media_type" NOT NULL,
	"status" "session_status" DEFAULT 'filter_pending' NOT NULL,
	"filters_proposed_at" timestamp,
	"filters_accepted_at" timestamp,
	"ended_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pairs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user1_id" uuid NOT NULL,
	"user2_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_filters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"year_min" integer,
	"year_max" integer,
	"genre_ids" integer[],
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_filters_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "swipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"tmdb_id" integer NOT NULL,
	"media_type" "media_type" NOT NULL,
	"direction" "swipe_direction" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pair_matches" ADD CONSTRAINT "pair_matches_pair_id_pairs_id_fk" FOREIGN KEY ("pair_id") REFERENCES "public"."pairs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pair_matches" ADD CONSTRAINT "pair_matches_session_id_pair_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."pair_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pair_requests" ADD CONSTRAINT "pair_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pair_requests" ADD CONSTRAINT "pair_requests_requested_id_users_id_fk" FOREIGN KEY ("requested_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pair_sessions" ADD CONSTRAINT "pair_sessions_pair_id_pairs_id_fk" FOREIGN KEY ("pair_id") REFERENCES "public"."pairs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pair_sessions" ADD CONSTRAINT "pair_sessions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pairs" ADD CONSTRAINT "pairs_user1_id_users_id_fk" FOREIGN KEY ("user1_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pairs" ADD CONSTRAINT "pairs_user2_id_users_id_fk" FOREIGN KEY ("user2_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_filters" ADD CONSTRAINT "session_filters_session_id_pair_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."pair_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_session_id_pair_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."pair_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pair_matches_pair_media_watched_idx" ON "pair_matches" USING btree ("pair_id","media_type","marked_watched");--> statement-breakpoint
CREATE INDEX "pair_requests_requested_status_idx" ON "pair_requests" USING btree ("requested_id","status");--> statement-breakpoint
CREATE INDEX "pair_requests_requester_idx" ON "pair_requests" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "pair_sessions_pair_status_idx" ON "pair_sessions" USING btree ("pair_id","status");--> statement-breakpoint
CREATE INDEX "pairs_user1_idx" ON "pairs" USING btree ("user1_id");--> statement-breakpoint
CREATE INDEX "pairs_user2_idx" ON "pairs" USING btree ("user2_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pairs_unique_idx" ON "pairs" USING btree ("user1_id","user2_id");--> statement-breakpoint
CREATE INDEX "swipes_session_tmdb_user_idx" ON "swipes" USING btree ("session_id","tmdb_id","user_id");--> statement-breakpoint
CREATE INDEX "swipes_created_at_idx" ON "swipes" USING btree ("created_at");