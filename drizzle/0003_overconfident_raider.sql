CREATE TABLE "quote_deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"actor_user_id" integer,
	"quote_amount" varchar(20) NOT NULL,
	"quote_summary" text NOT NULL,
	"delivery_status" varchar(24) NOT NULL,
	"response_code" integer,
	"error_message" text,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"delivered_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "quote_summary" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "quote_prepared_at" timestamp;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "quote_webhook_status" varchar(24);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "quote_webhook_error" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "quote_webhook_sent_at" timestamp;