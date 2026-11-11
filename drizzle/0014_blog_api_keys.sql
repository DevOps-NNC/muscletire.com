CREATE TABLE "blog_api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"key_prefix" varchar(16) NOT NULL,
	"key_hash" varchar(64) NOT NULL,
	"created_by_user_id" integer NOT NULL,
	"last_used_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE INDEX "blog_api_keys_revoked_at_idx" ON "blog_api_keys" USING btree ("revoked_at");
--> statement-breakpoint
CREATE TABLE "blog_api_idempotency" (
	"id" serial PRIMARY KEY NOT NULL,
	"api_key_id" integer NOT NULL,
	"idempotency_key" varchar(200) NOT NULL,
	"request_hash" varchar(64) NOT NULL,
	"article_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_api_idempotency_api_key_id_idempotency_key" UNIQUE ("api_key_id", "idempotency_key")
);
--> statement-breakpoint
CREATE INDEX "blog_api_idempotency_article_id_idx" ON "blog_api_idempotency" USING btree ("article_id");
