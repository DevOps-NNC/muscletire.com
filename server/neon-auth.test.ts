import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { verifyNeonAuthJwt } from "./_core/neonAuth";

describe("Neon Auth JWT verification", () => {
  it("accepts a signed Neon token without assuming the issuer is the host origin", async () => {
    const { privateKey, publicKey } = await generateKeyPair("EdDSA");
    const jwk = await exportJWK(publicKey);
    jwk.alg = "EdDSA";
    jwk.kid = "neon-test-key";

    const authUrl = "https://project.neonauth.example/neondb/auth";
    const token = await new SignJWT({
      sub: "neon-user-1",
      email: "owner@example.com",
      name: "Owner",
    })
      .setProtectedHeader({ alg: "EdDSA", kid: "neon-test-key" })
      .setIssuer(authUrl)
      .setExpirationTime("5m")
      .sign(privateKey);

    const identity = await verifyNeonAuthJwt(token, authUrl, {
      jwks: createLocalJWKSet({ keys: [jwk] }),
    });

    expect(identity).toEqual({
      userId: "neon-user-1",
      email: "owner@example.com",
      name: "Owner",
    });
  });

  it("rejects a token that is not signed by the configured Neon JWKS", async () => {
    const first = await generateKeyPair("EdDSA");
    const second = await generateKeyPair("EdDSA");
    const jwk = await exportJWK(first.publicKey);
    jwk.alg = "EdDSA";
    jwk.kid = "neon-test-key";
    const token = await new SignJWT({ sub: "neon-user-1" })
      .setProtectedHeader({ alg: "EdDSA", kid: "neon-test-key" })
      .setExpirationTime("5m")
      .sign(second.privateKey);

    await expect(
      verifyNeonAuthJwt(token, "https://project.neonauth.example/neondb/auth", {
        jwks: createLocalJWKSet({ keys: [jwk] }),
      }),
    ).rejects.toThrow();
  });
});
