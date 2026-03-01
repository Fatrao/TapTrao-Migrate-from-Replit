CREATE TYPE "public"."lc_case_status" AS ENUM('checking', 'all_clear', 'discrepancy', 'pending_correction', 'rechecking', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."trade_status" AS ENUM('active', 'in_transit', 'arrived', 'cleared', 'closed', 'archived');--> statement-breakpoint
CREATE TABLE "lc_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"source_lookup_id" uuid,
	"status" "lc_case_status" DEFAULT 'checking' NOT NULL,
	"initial_check_id" uuid,
	"latest_check_id" uuid,
	"recheck_count" integer DEFAULT 0 NOT NULL,
	"max_free_rechecks" integer DEFAULT 3 NOT NULL,
	"lc_reference" text,
	"beneficiary_name" text,
	"correction_requests" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"check_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"parked_at" timestamp,
	"closed_at" timestamp,
	"closed_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "trade_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lookup_id" uuid NOT NULL,
	"session_id" text NOT NULL,
	"event_type" text NOT NULL,
	"event_data" jsonb NOT NULL,
	"previous_hash" text,
	"event_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text,
	"session_id" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
ALTER TABLE "lc_checks" ADD COLUMN "correction_whatsapp" text;--> statement-breakpoint
ALTER TABLE "lc_checks" ADD COLUMN "case_id" uuid;--> statement-breakpoint
ALTER TABLE "lookups" ADD COLUMN "session_id" text;--> statement-breakpoint
ALTER TABLE "lookups" ADD COLUMN "trade_status" "trade_status" DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "lookups" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "lookups" ADD COLUMN "closed_at" timestamp;--> statement-breakpoint
ALTER TABLE "lookups" ADD COLUMN "estimated_arrival" date;--> statement-breakpoint
ALTER TABLE "lookups" ADD COLUMN "actual_arrival" date;--> statement-breakpoint
ALTER TABLE "lookups" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_events" ADD CONSTRAINT "trade_events_lookup_id_lookups_id_fk" FOREIGN KEY ("lookup_id") REFERENCES "public"."lookups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_lc_cases_session" ON "lc_cases" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_lc_cases_lookup" ON "lc_cases" USING btree ("source_lookup_id");--> statement-breakpoint
CREATE INDEX "password_reset_token_idx" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "trade_events_lookup_idx" ON "trade_events" USING btree ("lookup_id","created_at");--> statement-breakpoint
CREATE INDEX "trade_events_session_idx" ON "trade_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_session_idx" ON "users" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "lookups_session_idx" ON "lookups" USING btree ("session_id");