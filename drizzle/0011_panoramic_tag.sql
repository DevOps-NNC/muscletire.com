ALTER TABLE "analytics_channel_metrics" ALTER COLUMN "campaign" SET DEFAULT '';--> statement-breakpoint
UPDATE "analytics_channel_metrics" SET "campaign" = '' WHERE "campaign" IS NULL;--> statement-breakpoint
ALTER TABLE "analytics_channel_metrics" ALTER COLUMN "campaign" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "generated_marketing_reports_period_unique" ON "generated_marketing_reports" USING btree ("report_type","period_start","period_end");
