import { neon } from "@neondatabase/serverless";

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("NEON_DATABASE_URL is required");

const sql = neon(connectionString);
const email = "admin@innovate360marketing.com";
const managed = await sql`
  SELECT id, email, name FROM neon_auth."user" WHERE lower(email) = lower(${email}) LIMIT 1
`;
const local = await sql`
  SELECT id, neon_auth_user_id, email, role, must_change_password FROM public.users WHERE lower(email) = lower(${email})
`;
const accounts = await sql`
  SELECT "userId", "providerId", "accountId"
  FROM neon_auth.account
  WHERE "userId" = ${managed[0]?.id ?? ""}
`;
const sessionColumns = await sql`
  SELECT column_name FROM information_schema.columns WHERE table_schema = 'neon_auth' AND table_name = 'session' ORDER BY ordinal_position
`;
const recoveryState = await sql`
  SELECT setting_key, setting_value, updated_at
  FROM public.site_settings
  WHERE setting_key = 'crm_superadmin_recovery_used'
`;
console.log(JSON.stringify({ managed, local, accounts, sessionColumns, recoveryState }, null, 2));
