import { neon } from "@neondatabase/serverless";

const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("NEON_DATABASE_URL or POSTGRES_URL is required.");

const sql = neon(connectionString);
const settings = await sql`
  SELECT setting_key, setting_value
  FROM public.site_settings
  WHERE setting_key IN ('zapier_quote_webhook_url', 'zapier_quote_webhook_enabled')
`;
const deliveries = await sql`
  SELECT id, lead_id, quote_amount, delivery_status, response_code, error_message, created_at, delivered_at
  FROM public.quote_deliveries
  ORDER BY created_at DESC
  LIMIT 10
`;
const quotedLeads = await sql`
  SELECT id, reference_number, full_name, status, estimated_value,
    CASE WHEN quote_summary IS NULL OR quote_summary = '' THEN false ELSE true END AS has_quote_summary
  FROM public.leads
  WHERE estimated_value IS NOT NULL OR status = 'quoted'
  ORDER BY updated_at DESC
  LIMIT 20
`;

const sanitizedSettings = settings.map((setting) => setting.setting_key === "zapier_quote_webhook_url"
  ? { setting_key: setting.setting_key, configured: Boolean(setting.setting_value), host: setting.setting_value ? new URL(setting.setting_value).hostname : null }
  : setting,
);

console.log(JSON.stringify({ settings: sanitizedSettings, deliveries, quotedLeads }, null, 2));
