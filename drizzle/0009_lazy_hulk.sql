CREATE TYPE "public"."analytics_integration_status" AS ENUM('disconnected', 'connected', 'reauthorization_required', 'error');--> statement-breakpoint
CREATE TYPE "public"."analytics_provider" AS ENUM('ga4');--> statement-breakpoint
CREATE TYPE "public"."analytics_sync_status" AS ENUM('running', 'succeeded', 'partial', 'failed');--> statement-breakpoint
CREATE TYPE "public"."report_delivery_status" AS ENUM('prepared', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE "analytics_channel_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"integration_id" integer NOT NULL,
	"metric_date" varchar(10) NOT NULL,
	"channel" varchar(120) NOT NULL,
	"source" varchar(200) NOT NULL,
	"medium" varchar(200) NOT NULL,
	"campaign" varchar(500),
	"users" integer DEFAULT 0 NOT NULL,
	"sessions" integer DEFAULT 0 NOT NULL,
	"engaged_sessions" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_daily_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"integration_id" integer NOT NULL,
	"metric_date" varchar(10) NOT NULL,
	"users" integer DEFAULT 0 NOT NULL,
	"new_users" integer DEFAULT 0 NOT NULL,
	"active_users" integer DEFAULT 0 NOT NULL,
	"sessions" integer DEFAULT 0 NOT NULL,
	"engaged_sessions" integer DEFAULT 0 NOT NULL,
	"engagement_rate" numeric(8, 4),
	"average_engagement_time" numeric(12, 4),
	"page_views" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" "analytics_provider" DEFAULT 'ga4' NOT NULL,
	"owner_user_id" integer,
	"google_account_id" varchar(200),
	"google_account_email" varchar(320),
	"property_id" varchar(120),
	"property_name" varchar(300),
	"refresh_token_ciphertext" text,
	"refresh_token_iv" varchar(64),
	"refresh_token_auth_tag" varchar(64),
	"status" "analytics_integration_status" DEFAULT 'disconnected' NOT NULL,
	"connected_at" timestamp,
	"last_sync_at" timestamp,
	"next_sync_at" timestamp,
	"last_sync_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_page_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"integration_id" integer NOT NULL,
	"metric_date" varchar(10) NOT NULL,
	"page_path" varchar(1000) NOT NULL,
	"users" integer DEFAULT 0 NOT NULL,
	"sessions" integer DEFAULT 0 NOT NULL,
	"engaged_sessions" integer DEFAULT 0 NOT NULL,
	"page_views" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_sync_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"integration_id" integer NOT NULL,
	"requested_start" timestamp NOT NULL,
	"requested_end" timestamp NOT NULL,
	"status" "analytics_sync_status" DEFAULT 'running' NOT NULL,
	"rows_written" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generated_marketing_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_type" varchar(40) NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"comparison_start" timestamp,
	"comparison_end" timestamp,
	"snapshot" jsonb NOT NULL,
	"generated_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_report_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"time_zone" varchar(80) DEFAULT 'America/New_York' NOT NULL,
	"weekly_enabled" boolean DEFAULT false NOT NULL,
	"monthly_enabled" boolean DEFAULT false NOT NULL,
	"recipients" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"require_review" boolean DEFAULT true NOT NULL,
	"email_delivery_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_report_deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" integer NOT NULL,
	"recipient" varchar(320) NOT NULL,
	"format" varchar(20) DEFAULT 'csv' NOT NULL,
	"status" "report_delivery_status" DEFAULT 'prepared' NOT NULL,
	"provider_message_id" varchar(300),
	"error_message" text,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "analytics_channel_metrics_dimensions_unique" ON "analytics_channel_metrics" USING btree ("integration_id","metric_date","channel","source","medium","campaign");--> statement-breakpoint
CREATE UNIQUE INDEX "analytics_daily_metrics_integration_date_unique" ON "analytics_daily_metrics" USING btree ("integration_id","metric_date");--> statement-breakpoint
CREATE UNIQUE INDEX "analytics_integrations_provider_unique" ON "analytics_integrations" USING btree ("provider");--> statement-breakpoint
CREATE UNIQUE INDEX "analytics_page_metrics_path_unique" ON "analytics_page_metrics" USING btree ("integration_id","metric_date","page_path");--> statement-breakpoint
CREATE INDEX "analytics_sync_runs_integration_status_created_idx" ON "analytics_sync_runs" USING btree ("integration_id","status","created_at");