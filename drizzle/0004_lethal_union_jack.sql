CREATE TYPE "public"."quote_record_status" AS ENUM('active', 'archived', 'deleted');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'lead_processor';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'lead_viewer';--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"created_by_user_id" integer,
	"title" varchar(240) NOT NULL,
	"summary" text NOT NULL,
	"status" "quote_record_status" DEFAULT 'active' NOT NULL,
	"archived_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_invitations" ADD COLUMN "role" "user_role" DEFAULT 'lead_viewer' NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "first_viewed_at" timestamp;