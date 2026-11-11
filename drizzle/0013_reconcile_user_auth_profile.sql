ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "must_change_password" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE "users" SET "must_change_password" = false WHERE "must_change_password" IS NULL;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "must_change_password" SET DEFAULT false;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "must_change_password" SET NOT NULL;
