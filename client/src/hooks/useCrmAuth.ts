import { useAuth } from "@/_core/hooks/useAuth";
import { neonAuthClient, neonAuthEnabled } from "@/lib/neonAuth";
import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useState } from "react";

type CrmUser = { id: number; openId: string; name: string | null; email: string | null; role: "admin" | "user" | "technician" | "lead_processor" | "lead_viewer"; loginMethod: string | null; mustChangePassword: boolean; suspendedAt: Date | null; createdAt: Date; updatedAt: Date; lastSignedIn: Date };

export function useCrmAuth() {
  const manusAuth = useAuth();
  const utils = trpc.useUtils();
  const [neonUser, setNeonUser] = useState<CrmUser | null>(null);
  const [neonLoading, setNeonLoading] = useState(neonAuthEnabled);
  const verifiedProfile = trpc.auth.me.useQuery(undefined, { enabled: neonAuthEnabled && !neonLoading });

  useEffect(() => {
    if (!neonAuthEnabled || !neonAuthClient) return;
    neonAuthClient.getSession().then((result: any) => {
      const user = result.data?.user;
      if (user) {
        setNeonUser({
          id: 0,
          openId: user.id,
          name: user.name ?? null,
          email: user.email ?? null,
          role: "user",
          loginMethod: "neon",
          mustChangePassword: false,
          suspendedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        });
      }
      setNeonLoading(false);
    }).catch(() => setNeonLoading(false));
  }, []);

  const logout = useCallback(async () => {
    if (neonAuthEnabled && neonAuthClient) {
      await neonAuthClient.signOut();
      setNeonUser(null);
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    } else {
      await manusAuth.logout();
    }
    if (typeof window !== "undefined") window.location.assign("/admin/login");
  }, [manusAuth, utils]);

  if (neonAuthEnabled) {
    // Once the server profile query resolves, its null result is authoritative
    // (including for suspended users). Only use the provisional session profile
    // while that server check is still pending.
    const user = verifiedProfile.isSuccess ? verifiedProfile.data : neonUser;
    return { user, loading: neonLoading || verifiedProfile.isLoading, error: verifiedProfile.error, isAuthenticated: Boolean(user), logout };
  }
  return manusAuth;
}
