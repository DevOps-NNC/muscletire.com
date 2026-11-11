CREATE TABLE "lead_attributions" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"gclid" varchar(2048),
	"gbraid" varchar(2048),
	"wbraid" varchar(2048),
	"dclid" varchar(2048),
	"gclsrc" varchar(200),
	"utm_source" varchar(300),
	"utm_medium" varchar(300),
	"utm_campaign" varchar(500),
	"utm_term" varchar(500),
	"utm_content" varchar(500),
	"gad_source" varchar(300),
	"gad_campaign_id" varchar(300),
	"google_analytics_client_id" varchar(160),
	"google_analytics_session_id" varchar(160),
	"landing_url" text,
	"referrer" text,
	"ads_data_consent" boolean DEFAULT false NOT NULL,
	"captured_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lead_attributions_lead_id_unique" UNIQUE("lead_id")
);
--> statement-breakpoint
CREATE TABLE "lead_conversion_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"attribution_id" integer,
	"conversion_name" varchar(240) NOT NULL,
	"conversion_time" timestamp NOT NULL,
	"conversion_value" numeric(12, 2),
	"conversion_currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"order_id" varchar(160) NOT NULL,
	"include_user_data" boolean DEFAULT false NOT NULL,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"exported_at" timestamp,
	CONSTRAINT "lead_conversion_events_order_id_unique" UNIQUE("order_id")
);
