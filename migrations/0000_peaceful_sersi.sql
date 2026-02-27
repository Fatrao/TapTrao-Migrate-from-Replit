CREATE TYPE "public"."commodity_type" AS ENUM('agricultural', 'mineral', 'forestry', 'seafood', 'livestock', 'manufactured');--> statement-breakpoint
CREATE TYPE "public"."general_rule" AS ENUM('WHOLLY_OBTAINED', 'VALUE_ADD', 'CTH', 'CTSH', 'SPECIFIC_PROCESS');--> statement-breakpoint
CREATE TYPE "public"."lc_verdict" AS ENUM('COMPLIANT', 'COMPLIANT_WITH_NOTES', 'DISCREPANCIES_FOUND');--> statement-breakpoint
CREATE TYPE "public"."token_transaction_type" AS ENUM('PURCHASE', 'SPEND');--> statement-breakpoint
CREATE TABLE "afcfta_roo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hs_heading" varchar(10) NOT NULL,
	"general_rule" "general_rule" NOT NULL,
	"min_value_add_pct" integer,
	"alternative_criteria" jsonb,
	"specific_process" text,
	"notes" text,
	"source_ref" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_reads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_session_id" text NOT NULL,
	"alert_id" uuid,
	"read_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_session_id" text NOT NULL,
	"commodity_id" uuid,
	"dest_iso2" varchar(2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "commodities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"hs_code" varchar(10) NOT NULL,
	"commodity_type" "commodity_type" NOT NULL,
	"triggers_sps" boolean DEFAULT false NOT NULL,
	"triggers_eudr" boolean DEFAULT false NOT NULL,
	"triggers_kimberley" boolean DEFAULT false NOT NULL,
	"triggers_conflict" boolean DEFAULT false NOT NULL,
	"triggers_cbam" boolean DEFAULT false NOT NULL,
	"triggers_csddd" boolean DEFAULT false NOT NULL,
	"triggers_iuu" boolean DEFAULT false NOT NULL,
	"triggers_cites" boolean DEFAULT false NOT NULL,
	"triggers_lacey_act" boolean DEFAULT false NOT NULL,
	"triggers_fda_prior_notice" boolean DEFAULT false NOT NULL,
	"known_hazards" text[],
	"stop_flags" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"company_name" text NOT NULL,
	"registered_address" text NOT NULL,
	"country_iso2" varchar(2) NOT NULL,
	"vat_number" text,
	"eori_number" text,
	"contact_email" text,
	"profile_complete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "company_profiles_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "destinations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_name" text NOT NULL,
	"iso2" varchar(2) NOT NULL,
	"tariff_source" text NOT NULL,
	"vat_rate" numeric(5, 2) NOT NULL,
	"sps_regime" text NOT NULL,
	"security_filing" text NOT NULL,
	"special_rules" jsonb,
	"preference_schemes" jsonb,
	"is_afcfta_member" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "destinations_iso2_unique" UNIQUE("iso2")
);
--> statement-breakpoint
CREATE TABLE "eudr_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lookup_id" uuid,
	"user_session_id" text NOT NULL,
	"commodity_id" uuid,
	"origin_iso2" varchar(2),
	"dest_iso2" varchar(2),
	"plot_coordinates" jsonb,
	"plot_country_iso2" varchar(2),
	"plot_country_valid" boolean,
	"cutoff_date" date DEFAULT '2020-12-31',
	"evidence_type" text,
	"evidence_reference" text,
	"evidence_date" date,
	"supplier_name" text,
	"supplier_address" text,
	"supplier_reg_number" text,
	"sanctions_checked" boolean DEFAULT false,
	"sanctions_clear" boolean,
	"risk_level" text,
	"risk_factors" jsonb DEFAULT '[]'::jsonb,
	"high_risk_reason" text,
	"statement_json" jsonb,
	"statement_pdf_key" text,
	"status" text DEFAULT 'draft',
	"retention_until" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lc_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lc_fields_json" jsonb NOT NULL,
	"documents_json" jsonb NOT NULL,
	"results_json" jsonb NOT NULL,
	"summary" jsonb NOT NULL,
	"verdict" "lc_verdict" NOT NULL,
	"correction_email" text,
	"comms_log" jsonb,
	"integrity_hash" text,
	"source_lookup_id" uuid,
	"session_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lookups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commodity_id" uuid NOT NULL,
	"origin_id" uuid NOT NULL,
	"destination_id" uuid NOT NULL,
	"commodity_name" text NOT NULL,
	"origin_name" text NOT NULL,
	"destination_name" text NOT NULL,
	"hs_code" varchar(10) NOT NULL,
	"risk_level" text NOT NULL,
	"result_json" jsonb NOT NULL,
	"integrity_hash" text,
	"readiness_score" integer,
	"readiness_verdict" varchar(10),
	"readiness_factors" jsonb,
	"readiness_summary" text,
	"twinlog_ref" text,
	"twinlog_hash" text,
	"twinlog_locked_at" timestamp,
	"eudr_complete" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "origin_countries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_name" text NOT NULL,
	"iso2" varchar(2) NOT NULL,
	"framework_id" uuid,
	"phyto_authority" text NOT NULL,
	"coo_issuing_body" text NOT NULL,
	"customs_admin" text NOT NULL,
	"trade_portal_url" text,
	"commodity_councils" jsonb,
	"operational_notes" text,
	"is_afcfta_member" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'INCLUDE',
	"flag_reason" text,
	"flag_details" text,
	"agoa_status" text,
	"agoa_reason" text,
	"us_tariff_rate" text,
	"key_regulations" text,
	"primary_export_risk" text,
	"region" text,
	CONSTRAINT "origin_countries_iso2_unique" UNIQUE("iso2")
);
--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"trade_tokens" integer DEFAULT 0 NOT NULL,
	"lc_credits" integer DEFAULT 0 NOT NULL,
	"max_redemptions" integer DEFAULT 1 NOT NULL,
	"current_redemptions" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "promo_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "promo_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promo_code_id" uuid NOT NULL,
	"session_id" text NOT NULL,
	"redeemed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regional_frameworks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"member_countries" text[] NOT NULL,
	"cet_bands" jsonb,
	"coo_type" text NOT NULL,
	"export_procedures" text,
	"customs_code" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulatory_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text DEFAULT 'MANUAL' NOT NULL,
	"hs_codes_affected" text[] DEFAULT '{}',
	"dest_iso2_affected" varchar(2)[],
	"summary" text NOT NULL,
	"source_url" text,
	"effective_date" date,
	"is_deadline" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lookup_id" uuid,
	"user_session_id" text NOT NULL,
	"supplier_name" text DEFAULT 'Supplier' NOT NULL,
	"supplier_email" text,
	"supplier_whatsapp" text,
	"upload_token" uuid DEFAULT gen_random_uuid(),
	"upload_expires_at" timestamp NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"docs_required" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"docs_received" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sent_via" text[] DEFAULT '{}',
	"last_sent_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "supplier_requests_upload_token_unique" UNIQUE("upload_token")
);
--> statement-breakpoint
CREATE TABLE "supplier_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid,
	"doc_type" text NOT NULL,
	"original_filename" text NOT NULL,
	"file_key" text NOT NULL,
	"filesize_bytes" integer,
	"mime_type" text,
	"uploaded_at" timestamp DEFAULT now(),
	"uploaded_by" text DEFAULT 'supplier',
	"verified" boolean DEFAULT false,
	"finding" text,
	"ucp_rule" text
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"name" text NOT NULL,
	"commodity_id" uuid NOT NULL,
	"origin_iso2" varchar(2) NOT NULL,
	"dest_iso2" varchar(2) NOT NULL,
	"snapshot_json" jsonb NOT NULL,
	"reg_version_hash" text NOT NULL,
	"last_used_at" timestamp,
	"times_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"type" "token_transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"description" text NOT NULL,
	"stripe_session_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "twinlog_downloads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lookup_id" uuid,
	"session_id" text,
	"company_name" text,
	"eori_number" text,
	"document_statuses" jsonb,
	"pdf_hash" text,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_tokens" (
	"session_id" text PRIMARY KEY NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"lc_balance" integer DEFAULT 0 NOT NULL,
	"free_lookup_used" boolean DEFAULT false NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alert_reads" ADD CONSTRAINT "alert_reads_alert_id_regulatory_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."regulatory_alerts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_subscriptions" ADD CONSTRAINT "alert_subscriptions_commodity_id_commodities_id_fk" FOREIGN KEY ("commodity_id") REFERENCES "public"."commodities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eudr_records" ADD CONSTRAINT "eudr_records_lookup_id_lookups_id_fk" FOREIGN KEY ("lookup_id") REFERENCES "public"."lookups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eudr_records" ADD CONSTRAINT "eudr_records_commodity_id_commodities_id_fk" FOREIGN KEY ("commodity_id") REFERENCES "public"."commodities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "origin_countries" ADD CONSTRAINT "origin_countries_framework_id_regional_frameworks_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."regional_frameworks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_requests" ADD CONSTRAINT "supplier_requests_lookup_id_lookups_id_fk" FOREIGN KEY ("lookup_id") REFERENCES "public"."lookups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_uploads" ADD CONSTRAINT "supplier_uploads_request_id_supplier_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."supplier_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "afcfta_roo_hs_heading_idx" ON "afcfta_roo" USING btree ("hs_heading");--> statement-breakpoint
CREATE UNIQUE INDEX "alert_reads_unique_idx" ON "alert_reads" USING btree ("user_session_id","alert_id");--> statement-breakpoint
CREATE UNIQUE INDEX "alert_sub_unique_idx" ON "alert_subscriptions" USING btree ("user_session_id","commodity_id","dest_iso2");--> statement-breakpoint
CREATE INDEX "commodities_hs_code_idx" ON "commodities" USING btree ("hs_code");--> statement-breakpoint
CREATE INDEX "destinations_iso2_idx" ON "destinations" USING btree ("iso2");--> statement-breakpoint
CREATE INDEX "idx_eudr_lookup" ON "eudr_records" USING btree ("lookup_id");--> statement-breakpoint
CREATE INDEX "idx_eudr_session" ON "eudr_records" USING btree ("user_session_id");--> statement-breakpoint
CREATE INDEX "origin_countries_iso2_idx" ON "origin_countries" USING btree ("iso2");--> statement-breakpoint
CREATE UNIQUE INDEX "promo_redemption_unique_idx" ON "promo_redemptions" USING btree ("promo_code_id","session_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_requests_session" ON "supplier_requests" USING btree ("user_session_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_requests_token" ON "supplier_requests" USING btree ("upload_token");--> statement-breakpoint
CREATE INDEX "idx_supplier_uploads_request" ON "supplier_uploads" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "templates_session_idx" ON "templates" USING btree ("session_id");