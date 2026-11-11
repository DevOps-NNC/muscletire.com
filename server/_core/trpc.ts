import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../../shared/const.js";
import { canProcessLeads, canReadCrm, isOwnerEmail } from "../../shared/crmAccess.js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context.js";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const crmReadProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || !canReadCrm(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "This account does not have CRM lead access." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

export const leadWriteProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || !canProcessLeads(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "This account has read-only lead access." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

export const ownerProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin" || !isOwnerEmail(ctx.user.email, process.env.NEON_ADMIN_EMAIL)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the CRM owner can manage administrator access." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);
