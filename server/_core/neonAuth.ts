import * as jose from "jose";

export type NeonAuthIdentity = {
  userId: string;
  email: string | null;
  name: string | null;
};

type NeonAuthJwks = Parameters<typeof jose.jwtVerify>[1];

/**
 * Verify a Neon Auth JWT and return only the identity fields used by CRM RBAC.
 * The configured Neon JWKS is the trust boundary; the Auth URL may include a
 * path, so issuer validation must not assume that it is the URL origin.
 */
export async function verifyNeonAuthJwt(
  token: string,
  authUrl: string,
  options: { jwks?: NeonAuthJwks } = {},
): Promise<NeonAuthIdentity> {
  const jwks = options.jwks ?? jose.createRemoteJWKSet(new URL(`${authUrl}/.well-known/jwks.json`));
  const { payload } = await jose.jwtVerify(token, jwks);
  const userId = typeof payload.sub === "string" ? payload.sub : null;

  if (!userId) {
    throw new Error("Neon Auth token missing subject");
  }

  return {
    userId,
    email: typeof payload.email === "string" ? payload.email : null,
    name: typeof payload.name === "string" ? payload.name : null,
  };
}
