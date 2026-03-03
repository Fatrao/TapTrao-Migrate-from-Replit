CREATE TABLE "compliance_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_key" varchar(80) NOT NULL,
	"destination_iso2" varchar(2),
	"trigger_flag" text,
	"hs_code_prefix" varchar(10),
	"commodity_type" text,
	"transport_mode" text,
	"min_value" numeric(12, 2),
	"extra_conditions" jsonb,
	"title_template" text NOT NULL,
	"description_template" text NOT NULL,
	"issued_by_template" text NOT NULL,
	"when_needed" text NOT NULL,
	"tip_template" text NOT NULL,
	"portal_guide_template" text,
	"document_code" text,
	"is_supplier_side" boolean DEFAULT false NOT NULL,
	"owner" text DEFAULT 'IMPORTER' NOT NULL,
	"due_by" text DEFAULT 'BEFORE_LOADING' NOT NULL,
	"rule_category" text DEFAULT 'seed' NOT NULL,
	"regulation_ref" text,
	"sort_order" integer DEFAULT 100 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_date" date DEFAULT CURRENT_DATE NOT NULL,
	"expiry_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_rules_rule_key_unique" UNIQUE("rule_key")
);
--> statement-breakpoint
CREATE TABLE "feature_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'new' NOT NULL,
	"admin_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"email" text NOT NULL,
	"company_name" text,
	"source" text DEFAULT 'post_check' NOT NULL,
	"lookup_id" uuid,
	"commodity_name" text,
	"corridor_description" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_content" text,
	"utm_term" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp (6) with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_profiles" ADD COLUMN "ein_number" text;--> statement-breakpoint
ALTER TABLE "lookups" ADD COLUMN "trade_value" text;--> statement-breakpoint
ALTER TABLE "lookups" ADD COLUMN "trade_value_currency" varchar(3) DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE "user_tokens" ADD COLUMN "utm_source" text;--> statement-breakpoint
ALTER TABLE "user_tokens" ADD COLUMN "utm_medium" text;--> statement-breakpoint
ALTER TABLE "user_tokens" ADD COLUMN "utm_campaign" text;--> statement-breakpoint
ALTER TABLE "user_tokens" ADD COLUMN "utm_content" text;--> statement-breakpoint
ALTER TABLE "user_tokens" ADD COLUMN "utm_term" text;--> statement-breakpoint
CREATE INDEX "compliance_rules_dest_idx" ON "compliance_rules" USING btree ("destination_iso2");--> statement-breakpoint
CREATE INDEX "compliance_rules_trigger_idx" ON "compliance_rules" USING btree ("trigger_flag");--> statement-breakpoint
CREATE INDEX "compliance_rules_active_idx" ON "compliance_rules" USING btree ("is_active","effective_date");--> statement-breakpoint
CREATE INDEX "compliance_rules_sort_idx" ON "compliance_rules" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "feature_requests_session_idx" ON "feature_requests" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "leads_session_idx" ON "leads" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "leads_email_idx" ON "leads" USING btree ("email");