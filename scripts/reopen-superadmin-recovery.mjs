import { neon } from "@neondatabase/serverless";

const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;
const recoveryCode = process.env.CRM_BOOTSTRAP_RECOVERY_CODE;

if (!connectionString) throw new Error("NEON_DATABASE_URL or POSTGRES_URL is required.");
if (!recoveryCode || recoveryCode.length < 16) throw new Error("A fresh CRM_BOOTSTRAP_RECOVERY_CODE of at least 16 characters is required.");

const sql = neon(connectionString);
await sql`
  INSERT INTO public.site_settings (setting_key, setting_value, updated_at)
  VALUES ('crm_superadmin_recovery_used', 'unused', NOW())
  ON CONFLICT (setting_key)
  DO UPDATE SET setting_value = 'unused', updated_at = NOW()
`;

console.log("One-time superadmin recovery has been reopened. No secret values were displayed.");
