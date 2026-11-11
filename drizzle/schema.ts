import { boolean, index, integer, jsonb, numeric, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin", "technician", "lead_processor", "lead_viewer"]);
export const leadStatusEnum = pgEnum("lead_status", ["new", "contacted", "quoted", "scheduled", "in_progress", "completed", "declined", "duplicate", "spam"]);
export const contactMethodEnum = pgEnum("contact_method", ["call", "text", "email"]);
export const locationTypeEnum = pgEnum("location_type", ["home", "workplace", "roadside", "parking_lot", "dealership", "other"]);
export const articleStatusEnum = pgEnum("article_status", ["draft", "published", "scheduled"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["pending", "confirmed", "en_route", "completed", "cancelled"]);
export const quoteRecordStatusEnum = pgEnum("quote_record_status", ["active", "archived", "deleted"]);
export const analyticsProviderEnum = pgEnum("analytics_provider", ["ga4"]);
export const analyticsIntegrationStatusEnum = pgEnum("analytics_integration_status", ["disconnected", "connected", "reauthorization_required", "error"]);
export const analyticsSyncStatusEnum = pgEnum("analytics_sync_status", ["running", "succeeded", "partial", "failed"]);
export const reportDeliveryStatusEnum = pgEnum("report_delivery_status", ["prepared", "sent", "failed"]);

/** Auth-compatible staff profile. `neonAuthUserId` is populated when Neon Managed Better Auth is enabled. */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 128 }).notNull().unique(),
  neonAuthUserId: varchar("neon_auth_user_id", { length: 128 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  mustChangePassword: boolean("must_change_password").default(false).notNull(),
  suspendedAt: timestamp("suspended_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const adminInvitations = pgTable("admin_invitations", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 200 }),
  role: userRoleEnum("role").default("lead_viewer").notNull(),
  token: varchar("token", { length: 96 }).notNull().unique(),
  invitedByUserId: integer("invited_by_user_id"),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AdminInvitation = typeof adminInvitations.$inferSelect;

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  email: varchar("email", { length: 320 }),
  city: varchar("city", { length: 100 }),
  preferredContact: contactMethodEnum("preferred_contact").default("call"),
  totalJobs: integer("total_jobs").default(0).notNull(),
  lastContactedAt: timestamp("last_contacted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type Customer = typeof customers.$inferSelect;

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  year: varchar("year", { length: 4 }),
  make: varchar("make", { length: 100 }),
  model: varchar("model", { length: 100 }),
  trim: varchar("trim", { length: 100 }),
  vin: varchar("vin", { length: 17 }),
  mileage: varchar("mileage", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type Vehicle = typeof vehicles.$inferSelect;

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: varchar("title", { length: 300 }).notNull(),
  shortDescription: text("short_description"),
  content: text("content"),
  metaTitle: varchar("meta_title", { length: 200 }),
  metaDescription: varchar("meta_description", { length: 500 }),
  ogImage: varchar("og_image", { length: 500 }),
  iconName: varchar("icon_name", { length: 100 }),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type Service = typeof services.$inferSelect;

export const serviceAreas = pgTable("service_areas", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  county: varchar("county", { length: 100 }),
  state: varchar("state", { length: 50 }).default("FL"),
  content: text("content"),
  metaTitle: varchar("meta_title", { length: 200 }),
  metaDescription: varchar("meta_description", { length: 500 }),
  zipCodes: jsonb("zip_codes").$type<string[]>(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** Core CRM pipeline record; a lead can be tied to a reusable customer and vehicle profile. */
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  referenceNumber: varchar("reference_number", { length: 20 }).notNull().unique(),
  customerId: integer("customer_id"),
  vehicleId: integer("vehicle_id"),
  status: leadStatusEnum("status").default("new").notNull(),
  priority: varchar("priority", { length: 20 }).default("normal").notNull(),
  fullName: varchar("full_name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  email: varchar("email", { length: 320 }),
  preferredContact: contactMethodEnum("preferred_contact").default("call"),
  streetAddress: varchar("street_address", { length: 500 }),
  unit: varchar("unit", { length: 100 }),
  city: varchar("city", { length: 100 }),
  zipCode: varchar("zip_code", { length: 10 }),
  locationType: locationTypeEnum("location_type"),
  locationNotes: text("location_notes"),
  isInServiceArea: boolean("is_in_service_area"),
  vehicleYear: varchar("vehicle_year", { length: 4 }),
  vehicleMake: varchar("vehicle_make", { length: 100 }),
  vehicleModel: varchar("vehicle_model", { length: 100 }),
  vehicleTrim: varchar("vehicle_trim", { length: 100 }),
  vin: varchar("vin", { length: 17 }),
  mileage: varchar("mileage", { length: 20 }),
  requestedService: varchar("requested_service", { length: 200 }),
  mainSymptom: varchar("main_symptom", { length: 300 }),
  problemDescription: text("problem_description"),
  vehicleStarts: boolean("vehicle_starts"),
  vehicleSafe: boolean("vehicle_safe"),
  preferredDate: varchar("preferred_date", { length: 20 }),
  preferredTime: varchar("preferred_time", { length: 50 }),
  isAsap: boolean("is_asap").default(false),
  customerNotes: text("customer_notes"),
  internalNotes: text("internal_notes"),
  nextActionAt: timestamp("next_action_at"),
  lastContactedAt: timestamp("last_contacted_at"),
  estimatedValue: varchar("estimated_value", { length: 20 }),
  finalValue: varchar("final_value", { length: 20 }),
  quoteSummary: text("quote_summary"),
  quotePreparedAt: timestamp("quote_prepared_at"),
  quoteWebhookStatus: varchar("quote_webhook_status", { length: 24 }),
  quoteWebhookError: text("quote_webhook_error"),
  quoteWebhookSentAt: timestamp("quote_webhook_sent_at"),
  firstViewedAt: timestamp("first_viewed_at"),
  archivedAt: timestamp("archived_at"),
  deletedAt: timestamp("deleted_at"),
  source: varchar("source", { length: 100 }).default("website"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/** First-touch campaign context captured from an eligible public request URL. */
export const leadAttributions = pgTable("lead_attributions", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().unique(),
  gclid: varchar("gclid", { length: 2048 }),
  gbraid: varchar("gbraid", { length: 2048 }),
  wbraid: varchar("wbraid", { length: 2048 }),
  dclid: varchar("dclid", { length: 2048 }),
  gclsrc: varchar("gclsrc", { length: 200 }),
  utmSource: varchar("utm_source", { length: 300 }),
  utmMedium: varchar("utm_medium", { length: 300 }),
  utmCampaign: varchar("utm_campaign", { length: 500 }),
  utmTerm: varchar("utm_term", { length: 500 }),
  utmContent: varchar("utm_content", { length: 500 }),
  gadSource: varchar("gad_source", { length: 300 }),
  gadCampaignId: varchar("gad_campaign_id", { length: 300 }),
  googleAnalyticsClientId: varchar("google_analytics_client_id", { length: 160 }),
  googleAnalyticsSessionId: varchar("google_analytics_session_id", { length: 160 }),
  landingUrl: text("landing_url"),
  referrer: text("referrer"),
  adsDataConsent: boolean("ads_data_consent").default(false).notNull(),
  capturedAt: timestamp("captured_at").defaultNow().notNull(),
});
export type LeadAttribution = typeof leadAttributions.$inferSelect;

/** Owner-recorded offline conversion outcomes exported to Google Ads Data Manager. */
export const leadConversionEvents = pgTable("lead_conversion_events", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  attributionId: integer("attribution_id"),
  conversionName: varchar("conversion_name", { length: 240 }).notNull(),
  conversionTime: timestamp("conversion_time").notNull(),
  conversionValue: numeric("conversion_value", { precision: 12, scale: 2 }),
  conversionCurrency: varchar("conversion_currency", { length: 3 }).default("USD").notNull(),
  orderId: varchar("order_id", { length: 160 }).notNull().unique(),
  includeUserData: boolean("include_user_data").default(false).notNull(),
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  exportedAt: timestamp("exported_at"),
});
export type LeadConversionEvent = typeof leadConversionEvents.$inferSelect;

export const quoteDeliveries = pgTable("quote_deliveries", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  actorUserId: integer("actor_user_id"),
  quoteAmount: varchar("quote_amount", { length: 20 }).notNull(),
  quoteSummary: text("quote_summary").notNull(),
  deliveryStatus: varchar("delivery_status", { length: 24 }).notNull(),
  responseCode: integer("response_code"),
  errorMessage: text("error_message"),
  payload: jsonb("payload").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
});
export type QuoteDelivery = typeof quoteDeliveries.$inferSelect;

/** Internal service summary record. Pricing is intentionally not stored or displayed. */
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  createdByUserId: integer("created_by_user_id"),
  title: varchar("title", { length: 240 }).notNull(),
  summary: text("summary").notNull(),
  status: quoteRecordStatusEnum("status").default("active").notNull(),
  archivedAt: timestamp("archived_at"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type Quote = typeof quotes.$inferSelect;

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  customerId: integer("customer_id"),
  scheduledStart: timestamp("scheduled_start").notNull(),
  durationMinutes: integer("duration_minutes").default(90).notNull(),
  status: appointmentStatusEnum("status").default("pending").notNull(),
  serviceAddress: text("service_address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type Appointment = typeof appointments.$inferSelect;

export const leadActivities = pgTable("lead_activities", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  customerId: integer("customer_id"),
  actorUserId: integer("actor_user_id"),
  type: varchar("type", { length: 80 }).notNull(),
  summary: text("summary").notNull(),
  metadata: jsonb("metadata").$type<Record<string, string | number | boolean | null>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type LeadActivity = typeof leadActivities.$inferSelect;

export const leadFiles = pgTable("lead_files", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  fileName: varchar("file_name", { length: 300 }).notNull(),
  fileKey: varchar("file_key", { length: 500 }).notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 300 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  excerpt: text("excerpt"),
  content: text("content"),
  featuredImage: varchar("featured_image", { length: 500 }),
  authorName: varchar("author_name", { length: 200 }).default("__BUSINESS_NAME__"),
  category: varchar("category", { length: 100 }),
  tags: jsonb("tags").$type<string[]>(),
  metaTitle: varchar("meta_title", { length: 200 }),
  metaDescription: varchar("meta_description", { length: 500 }),
  ogImage: varchar("og_image", { length: 500 }),
  status: articleStatusEnum("status").default("draft").notNull(),
  publishedAt: timestamp("published_at"),
  scheduledAt: timestamp("scheduled_at"),
  noIndex: boolean("no_index").default(false),
  createdByBlogApiKeyId: integer("created_by_blog_api_key_id"),
  readingTime: integer("reading_time"),
  relatedServices: jsonb("related_services").$type<string[]>(),
  faqs: jsonb("faqs").$type<Array<{ question: string; answer: string }>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const blogApiKeys = pgTable("blog_api_keys", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  keyPrefix: varchar("key_prefix", { length: 16 }).notNull(),
  keyHash: varchar("key_hash", { length: 64 }).notNull().unique(),
  createdByUserId: integer("created_by_user_id").notNull(),
  lastUsedAt: timestamp("last_used_at"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => [index("blog_api_keys_revoked_at_idx").on(table.revokedAt)]);
export type BlogApiKey = typeof blogApiKeys.$inferSelect;

export const blogApiIdempotency = pgTable("blog_api_idempotency", {
  id: serial("id").primaryKey(),
  apiKeyId: integer("api_key_id").notNull(),
  idempotencyKey: varchar("idempotency_key", { length: 200 }).notNull(),
  requestHash: varchar("request_hash", { length: 64 }).notNull(),
  articleId: integer("article_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => [
  uniqueIndex("blog_api_idempotency_api_key_id_idempotency_key").on(table.apiKeyId, table.idempotencyKey),
  index("blog_api_idempotency_article_id_idx").on(table.articleId),
]);
export type BlogApiIdempotency = typeof blogApiIdempotency.$inferSelect;

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 100 }),
  relatedService: varchar("related_service", { length: 200 }),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 200 }).notNull(),
  content: text("content").notNull(),
  rating: integer("rating").default(5),
  servicePerformed: varchar("service_performed", { length: 200 }),
  vehicleInfo: varchar("vehicle_info", { length: 200 }),
  city: varchar("city", { length: 100 }),
  sourceUrl: varchar("source_url", { length: 500 }),
  isVerified: boolean("is_verified").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  settingKey: varchar("setting_key", { length: 100 }).notNull().unique(),
  settingValue: text("setting_value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** Immutable snapshots for owner-approved public-page edits and controlled rollback. */
export const pageEditHistory = pgTable("page_edit_history", {
  id: serial("id").primaryKey(),
  pageId: varchar("page_id", { length: 80 }).notNull(),
  summary: varchar("summary", { length: 400 }).notNull(),
  config: jsonb("config").$type<Record<string, unknown>>().notNull(),
  actorUserId: integer("actor_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type PageEditHistory = typeof pageEditHistory.$inferSelect;

/** Protected GA4 connection metadata. Refresh tokens are encrypted before insertion. */
export const analyticsIntegrations = pgTable("analytics_integrations", {
  id: serial("id").primaryKey(),
  provider: analyticsProviderEnum("provider").default("ga4").notNull(),
  ownerUserId: integer("owner_user_id"),
  googleAccountId: varchar("google_account_id", { length: 200 }),
  googleAccountEmail: varchar("google_account_email", { length: 320 }),
  propertyId: varchar("property_id", { length: 120 }),
  propertyName: varchar("property_name", { length: 300 }),
  refreshTokenCiphertext: text("refresh_token_ciphertext"),
  refreshTokenIv: varchar("refresh_token_iv", { length: 64 }),
  refreshTokenAuthTag: varchar("refresh_token_auth_tag", { length: 64 }),
  status: analyticsIntegrationStatusEnum("status").default("disconnected").notNull(),
  connectedAt: timestamp("connected_at"),
  lastSyncAt: timestamp("last_sync_at"),
  nextSyncAt: timestamp("next_sync_at"),
  lastSyncError: text("last_sync_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, table => ({
  providerUnique: uniqueIndex("analytics_integrations_provider_unique").on(table.provider),
}));
export type AnalyticsIntegration = typeof analyticsIntegrations.$inferSelect;

export const analyticsSyncRuns = pgTable("analytics_sync_runs", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").notNull(),
  requestedStart: timestamp("requested_start").notNull(),
  requestedEnd: timestamp("requested_end").notNull(),
  status: analyticsSyncStatusEnum("status").default("running").notNull(),
  rowsWritten: integer("rows_written").default(0).notNull(),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => ({
  integrationStatusCreatedIndex: index("analytics_sync_runs_integration_status_created_idx").on(table.integrationId, table.status, table.createdAt),
}));
export type AnalyticsSyncRun = typeof analyticsSyncRuns.$inferSelect;

export const analyticsDailyMetrics = pgTable("analytics_daily_metrics", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").notNull(),
  metricDate: varchar("metric_date", { length: 10 }).notNull(),
  users: integer("users").default(0).notNull(),
  newUsers: integer("new_users").default(0).notNull(),
  activeUsers: integer("active_users").default(0).notNull(),
  sessions: integer("sessions").default(0).notNull(),
  engagedSessions: integer("engaged_sessions").default(0).notNull(),
  engagementRate: numeric("engagement_rate", { precision: 8, scale: 4 }),
  averageEngagementTime: numeric("average_engagement_time", { precision: 12, scale: 4 }),
  pageViews: integer("page_views").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, table => ({
  integrationDateUnique: uniqueIndex("analytics_daily_metrics_integration_date_unique").on(table.integrationId, table.metricDate),
}));
export type AnalyticsDailyMetric = typeof analyticsDailyMetrics.$inferSelect;

export const analyticsChannelMetrics = pgTable("analytics_channel_metrics", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").notNull(),
  metricDate: varchar("metric_date", { length: 10 }).notNull(),
  channel: varchar("channel", { length: 120 }).notNull(),
  source: varchar("source", { length: 200 }).notNull(),
  medium: varchar("medium", { length: 200 }).notNull(),
  campaign: varchar("campaign", { length: 500 }).default("").notNull(),
  users: integer("users").default(0).notNull(),
  sessions: integer("sessions").default(0).notNull(),
  engagedSessions: integer("engaged_sessions").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => ({
  channelDimensionsUnique: uniqueIndex("analytics_channel_metrics_dimensions_unique").on(table.integrationId, table.metricDate, table.channel, table.source, table.medium, table.campaign),
}));
export type AnalyticsChannelMetric = typeof analyticsChannelMetrics.$inferSelect;

export const analyticsPageMetrics = pgTable("analytics_page_metrics", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").notNull(),
  metricDate: varchar("metric_date", { length: 10 }).notNull(),
  pagePath: varchar("page_path", { length: 1000 }).notNull(),
  users: integer("users").default(0).notNull(),
  sessions: integer("sessions").default(0).notNull(),
  engagedSessions: integer("engaged_sessions").default(0).notNull(),
  pageViews: integer("page_views").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => ({
  pagePathUnique: uniqueIndex("analytics_page_metrics_path_unique").on(table.integrationId, table.metricDate, table.pagePath),
}));
export type AnalyticsPageMetric = typeof analyticsPageMetrics.$inferSelect;

/** Range-level GA4 totals preserve unique users for a selected reporting window. */
export const analyticsPeriodMetrics = pgTable("analytics_period_metrics", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").notNull(),
  periodStart: varchar("period_start", { length: 10 }).notNull(),
  periodEnd: varchar("period_end", { length: 10 }).notNull(),
  users: integer("users").default(0).notNull(),
  newUsers: integer("new_users").default(0).notNull(),
  activeUsers: integer("active_users").default(0).notNull(),
  sessions: integer("sessions").default(0).notNull(),
  engagedSessions: integer("engaged_sessions").default(0).notNull(),
  engagementRate: numeric("engagement_rate", { precision: 8, scale: 4 }),
  averageEngagementTime: numeric("average_engagement_time", { precision: 12, scale: 4 }),
  pageViews: integer("page_views").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, table => ({
  periodUnique: uniqueIndex("analytics_period_metrics_range_unique").on(table.integrationId, table.periodStart, table.periodEnd),
}));
export type AnalyticsPeriodMetric = typeof analyticsPeriodMetrics.$inferSelect;

export const marketingReportConfigs = pgTable("marketing_report_configs", {
  id: serial("id").primaryKey(),
  timeZone: varchar("time_zone", { length: 80 }).default("America/New_York").notNull(),
  weeklyEnabled: boolean("weekly_enabled").default(false).notNull(),
  monthlyEnabled: boolean("monthly_enabled").default(false).notNull(),
  recipients: jsonb("recipients").$type<string[]>().default([]).notNull(),
  requireReview: boolean("require_review").default(true).notNull(),
  emailDeliveryEnabled: boolean("email_delivery_enabled").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type MarketingReportConfig = typeof marketingReportConfigs.$inferSelect;

export const generatedMarketingReports = pgTable("generated_marketing_reports", {
  id: serial("id").primaryKey(),
  reportType: varchar("report_type", { length: 40 }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  comparisonStart: timestamp("comparison_start"),
  comparisonEnd: timestamp("comparison_end"),
  snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
  generatedByUserId: integer("generated_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => ({
  reportPeriodUnique: uniqueIndex("generated_marketing_reports_period_unique").on(table.reportType, table.periodStart, table.periodEnd),
}));
export type GeneratedMarketingReport = typeof generatedMarketingReports.$inferSelect;

export const marketingReportDeliveries = pgTable("marketing_report_deliveries", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull(),
  recipient: varchar("recipient", { length: 320 }).notNull(),
  format: varchar("format", { length: 20 }).default("csv").notNull(),
  status: reportDeliveryStatusEnum("status").default("prepared").notNull(),
  providerMessageId: varchar("provider_message_id", { length: 300 }),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type MarketingReportDelivery = typeof marketingReportDeliveries.$inferSelect;
