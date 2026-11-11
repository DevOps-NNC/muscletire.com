import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) {
  throw new Error("NEON_DATABASE_URL is required to apply the Neon migration.");
}

const db = drizzle(neon(connectionString));
await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Neon PostgreSQL migrations applied successfully.");
