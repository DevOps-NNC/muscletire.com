import { neon } from "@neondatabase/serverless";
import { describe, expect, it } from "vitest";

describe("Neon CRM schema", () => {
  it("contains the core CRM tables after migration", async () => {
    const sql = neon(process.env.NEON_DATABASE_URL!);
    const rows = await sql<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'customers', 'vehicles', 'leads', 'appointments', 'lead_activities', 'admin_invitations', 'quote_deliveries', 'quotes')
    `;
    expect(new Set(rows.map((row) => row.table_name))).toEqual(
      new Set(['users', 'customers', 'vehicles', 'leads', 'appointments', 'lead_activities', 'admin_invitations', 'quote_deliveries', 'quotes']),
    );
  }, 15_000);

  it("stores quote delivery state on leads", async () => {
    const sql = neon(process.env.NEON_DATABASE_URL!);
    const rows = await sql<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'leads'
      AND column_name IN ('quote_summary', 'quote_webhook_status', 'quote_webhook_sent_at')
    `;
    expect(new Set(rows.map((row) => row.column_name))).toEqual(new Set(['quote_summary', 'quote_webhook_status', 'quote_webhook_sent_at']));
  }, 15_000);

  it("enforces the first-login password-change flag on CRM users", async () => {
    const sql = neon(process.env.NEON_DATABASE_URL!);
    const rows = await sql<{ column_name: string }[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'must_change_password'
    `;
    expect(rows).toHaveLength(1);
  }, 15_000);

  it("stores quote lifecycle and viewed-lead state", async () => {
    const sql = neon(process.env.NEON_DATABASE_URL!);
    const [quoteColumns, leadColumns] = await Promise.all([
      sql<{ column_name: string }[]>`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name IN ('status', 'archived_at', 'deleted_at')`,
      sql<{ column_name: string }[]>`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name IN ('first_viewed_at', 'archived_at', 'deleted_at')`,
    ]);
    expect(new Set(quoteColumns.map((row) => row.column_name))).toEqual(new Set(['status', 'archived_at', 'deleted_at']));
    expect(new Set(leadColumns.map((row) => row.column_name))).toEqual(new Set(['first_viewed_at', 'archived_at', 'deleted_at']));
  }, 20_000);

  it("stores immutable page-edit snapshots for owner rollback", async () => {
    const sql = neon(process.env.NEON_DATABASE_URL!);
    const rows = await sql<{ column_name: string }[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'page_edit_history'
      AND column_name IN ('page_id', 'summary', 'config', 'actor_user_id', 'created_at')
    `;
    expect(new Set(rows.map((row) => row.column_name))).toEqual(new Set(['page_id', 'summary', 'config', 'actor_user_id', 'created_at']));
  }, 15_000);
});
