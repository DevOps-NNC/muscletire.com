import { z } from "zod";
import { blogApiKeys } from "../../drizzle/schema.js";
import { createBlogApiKey } from "../blogApiSecurity.js";
import { toPublicBlogApiKey } from "../blogApiRepository.js";
import { getDb } from "../db.js";
import { ownerProcedure, router } from "../_core/trpc.js";
import { desc, eq } from "drizzle-orm";

const keyNameInput = z.object({ name: z.string().trim().min(1).max(120) });

export const blogApiKeysRouter = router({
  list: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const keys = await db.select().from(blogApiKeys).orderBy(desc(blogApiKeys.createdAt));
    return keys.map(toPublicBlogApiKey);
  }),

  create: ownerProcedure.input(keyNameInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const generated = createBlogApiKey();
    const [key] = await db.insert(blogApiKeys).values({
      name: input.name,
      keyPrefix: generated.prefix,
      keyHash: generated.hash,
      createdByUserId: ctx.user.id,
    }).returning();
    if (!key) throw new Error("Could not create blog API key");
    return { ...toPublicBlogApiKey(key), secret: generated.secret };
  }),

  revoke: ownerProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(blogApiKeys).set({ revokedAt: new Date() }).where(eq(blogApiKeys.id, input.id));
    return { success: true as const };
  }),
});
