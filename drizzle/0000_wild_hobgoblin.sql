CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'confirmed', 'en_route', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."article_status" AS ENUM('draft', 'published', 'scheduled');--> statement-breakpoint
CREATE TYPE "public"."contact_method" AS ENUM('call', 'text', 'email');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'quoted', 'scheduled', 'in_progress', 'completed', 'declined', 'duplicate', 'spam');--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('home', 'workplace', 'roadside', 'parking_lot', 'dealership', 'other');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin', 'technician');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"customer_id" integer,
	"scheduled_start" timestamp NOT NULL,
	"duration_minutes" integer DEFAULT 90 NOT NULL,
	"status" "appointment_status" DEFAULT 'pending' NOT NULL,
	"service_address" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(300) NOT NULL,
	"title" varchar(500) NOT NULL,
	"excerpt" text,
	"content" text,
	"featured_image" varchar(500),
	"author_name" varchar(200) DEFAULT '__BUSINESS_NAME__',
	"category" varchar(100),
	"tags" jsonb,
	"meta_title" varchar(200),
	"meta_description" varchar(500),
	"og_image" varchar(500),
	"status" "article_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"scheduled_at" timestamp,
	"no_index" boolean DEFAULT false,
	"reading_time" integer,
	"related_services" jsonb,
	"faqs" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(200) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"email" varchar(320),
	"city" varchar(100),
	"preferred_contact" "contact_method" DEFAULT 'call',
	"total_jobs" integer DEFAULT 0 NOT NULL,
	"last_contacted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" varchar(100),
	"related_service" varchar(200),
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"customer_id" integer,
	"actor_user_id" integer,
	"type" varchar(80) NOT NULL,
	"summary" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"file_name" varchar(300) NOT NULL,
	"file_key" varchar(500) NOT NULL,
	"file_url" varchar(500) NOT NULL,
	"mime_type" varchar(100),
	"file_size" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference_number" varchar(20) NOT NULL,
	"customer_id" integer,
	"vehicle_id" integer,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"full_name" varchar(200) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"email" varchar(320),
	"preferred_contact" "contact_method" DEFAULT 'call',
	"street_address" varchar(500),
	"unit" varchar(100),
	"city" varchar(100),
	"zip_code" varchar(10),
	"location_type" "location_type",
	"location_notes" text,
	"is_in_service_area" boolean,
	"vehicle_year" varchar(4),
	"vehicle_make" varchar(100),
	"vehicle_model" varchar(100),
	"vehicle_trim" varchar(100),
	"vin" varchar(17),
	"mileage" varchar(20),
	"requested_service" varchar(200),
	"main_symptom" varchar(300),
	"problem_description" text,
	"vehicle_starts" boolean,
	"vehicle_safe" boolean,
	"preferred_date" varchar(20),
	"preferred_time" varchar(50),
	"is_asap" boolean DEFAULT false,
	"customer_notes" text,
	"internal_notes" text,
	"next_action_at" timestamp,
	"last_contacted_at" timestamp,
	"estimated_value" varchar(20),
	"final_value" varchar(20),
	"source" varchar(100) DEFAULT 'website',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leads_reference_number_unique" UNIQUE("reference_number")
);
--> statement-breakpoint
CREATE TABLE "service_areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(200) NOT NULL,
	"county" varchar(100),
	"state" varchar(50) DEFAULT 'FL',
	"content" text,
	"meta_title" varchar(200),
	"meta_description" varchar(500),
	"zip_codes" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_areas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"title" varchar(300) NOT NULL,
	"short_description" text,
	"content" text,
	"meta_title" varchar(200),
	"meta_description" varchar(500),
	"og_image" varchar(500),
	"icon_name" varchar(100),
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"setting_key" varchar(100) NOT NULL,
	"setting_value" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"rating" integer DEFAULT 5,
	"service_performed" varchar(200),
	"vehicle_info" varchar(200),
	"city" varchar(100),
	"source_url" varchar(500),
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"open_id" varchar(128) NOT NULL,
	"neon_auth_user_id" varchar(128),
	"name" text,
	"email" varchar(320),
	"login_method" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_signed_in" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_open_id_unique" UNIQUE("open_id"),
	CONSTRAINT "users_neon_auth_user_id_unique" UNIQUE("neon_auth_user_id")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"year" varchar(4),
	"make" varchar(100),
	"model" varchar(100),
	"trim" varchar(100),
	"vin" varchar(17),
	"mileage" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
