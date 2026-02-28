CREATE TABLE "document_extractions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"document_type" text NOT NULL,
	"original_filename" text NOT NULL,
	"extracted_text" text,
	"extraction_json" jsonb,
	"overall_confidence" text,
	"llm_model" text,
	"llm_tokens_used" integer,
	"processing_time_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commodities" ADD COLUMN "triggers_reach" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "commodities" ADD COLUMN "triggers_section_232" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "commodities" ADD COLUMN "triggers_fsis" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_doc_extractions_session" ON "document_extractions" USING btree ("session_id");