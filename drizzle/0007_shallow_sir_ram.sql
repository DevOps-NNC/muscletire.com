CREATE TABLE "page_edit_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_id" varchar(80) NOT NULL,
	"summary" varchar(400) NOT NULL,
	"config" jsonb NOT NULL,
	"actor_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
