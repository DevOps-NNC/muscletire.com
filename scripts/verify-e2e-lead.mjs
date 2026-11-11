import { neon } from "@neondatabase/serverless";

const referenceNumber = process.argv[2];
const connectionString = process.env.POSTGRES_URL ?? process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL;

if (!referenceNumber || !connectionString) {
  throw new Error("Usage: node scripts/verify-e2e-lead.mjs <reference-number>");
}

const sql = neon(connectionString);
const leads = await sql`
  select id, reference_number, full_name, street_address, city, zip_code, quote_webhook_status, quote_webhook_error, quote_webhook_sent_at
  from leads
  where reference_number = ${referenceNumber}
  limit 1
`;

const lead = leads[0];
if (!lead) throw new Error(`No lead found for ${referenceNumber}`);

const deliveries = await sql`
  select delivery_status, response_code, error_message, delivered_at, created_at
  from quote_deliveries
  where lead_id = ${lead.id}
  order by created_at desc
  limit 3
`;

console.log(JSON.stringify({ lead, deliveries }, null, 2));
