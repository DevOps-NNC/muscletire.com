import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { neonAuthClient } from "@/lib/neonAuth";
import { trpc } from "@/lib/trpc";
import { KeyRound, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useLocation } from "wouter";

export default function ChangePassword() {
  const [, navigate] = useLocation();
  const finishPasswordChange = trpc.crm.completeFirstPasswordChange.useMutation();
  const [currentPassword, setCurrentPassword] = useState(""); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!neonAuthClient) return;
    if (password.length < 12) return setError("Use at least 12 characters for your new password.");
    if (password !== confirm) return setError("New passwords do not match.");
    setLoading(true); setError("");
    try {
      const result = await Promise.race([
        (neonAuthClient as any).changePassword({ currentPassword, newPassword: password, revokeOtherSessions: true }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("The secure password service took too long to respond. Please try again.")), 15_000)),
      ]);
      if (result.error) return setError(result.error.message ?? "Unable to change your password. If you no longer know the temporary password, use password recovery.");
      await finishPasswordChange.mutateAsync();
      navigate("/admin");
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : "Unable to change your password. Please try again or use password recovery.");
    } finally { setLoading(false); }
  };
  return <main className="grid min-h-screen place-items-center bg-[var(--color-page-bg)] px-4 py-12"><section className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-card-bg)] p-8 shadow-xl"><div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-[var(--color-text-inverse)]"><KeyRound className="h-6 w-6" /></div><p className="mt-5 text-sm font-bold uppercase tracking-[.16em] text-primary">Security step required</p><h1 className="mt-1 text-3xl font-black">Choose your permanent password</h1><div className="mt-4 flex gap-3 rounded-xl bg-[var(--color-primary-soft)] p-4 text-sm text-[var(--color-text-main)]"><ShieldCheck className="h-5 w-5 shrink-0 text-primary" /><p>Your temporary password must be replaced before entering the CRM. This protects administrator access.</p></div><form onSubmit={submit} className="mt-6 space-y-4"><input type="email" autoComplete="username" className="sr-only" aria-hidden="true" tabIndex={-1} /><div><Label>Temporary password</Label><Input type="password" required value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} className="mt-1" autoComplete="current-password" /></div><div><Label>New permanent password</Label><Input type="password" required value={password} onChange={event => setPassword(event.target.value)} className="mt-1" autoComplete="new-password" /></div><div><Label>Confirm new password</Label><Input type="password" required value={confirm} onChange={event => setConfirm(event.target.value)} className="mt-1" autoComplete="new-password" /></div>{error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<Button className="w-full" disabled={loading}>{loading ? "Securing account…" : "Set permanent password"}</Button></form></section></main>;
}
