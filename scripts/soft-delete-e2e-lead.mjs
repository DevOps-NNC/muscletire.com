import { neon } from "@neondatabase/serverless";

const referenceNumber = process.argv[2];
const connectionString = process.env.POSTGRES_URL ?? process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL;

if (!referenceNumber || !connectionString) {
  throw new Error("Usage: node scripts/soft-delete-e2e-lead.mjs <reference-number>");
}

const sql = neon(connectionString);
const updated = await sql`
  update leads
  set deleted_at = now(), updated_at = now()
  where reference_number = ${referenceNumber}
    and full_name = 'Website Form QA — Please Delete'
    and deleted_at is null
  returning reference_number, deleted_at
`;

if (!updated[0]) throw new Error(`Expected labeled QA lead ${referenceNumber} was not eligible for soft deletion`);
console.log(JSON.stringify(updated[0]));
