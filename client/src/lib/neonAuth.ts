import { createAuthClient } from "@neondatabase/neon-js/auth";

const authUrl = import.meta.env.VITE_NEON_AUTH_URL as string | undefined;

/** Neon Managed Better Auth is deliberately opt-in so local development can use the existing session flow. */
export const neonAuthEnabled = Boolean(authUrl);
export const neonAuthClient = authUrl ? createAuthClient(authUrl) : null;
