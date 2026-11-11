import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { neonAuthClient, neonAuthEnabled } from "@/lib/neonAuth";
import { FormEvent, useState } from "react";
import { Link } from "wouter";

export default function ForgotPassword() {
  const [email, setEmail] = useState(""); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!neonAuthClient) return;
    setLoading(true); setError(""); setMessage("");
    try {
      const result = await Promise.race([
        (neonAuthClient as any).requestPasswordReset({ email, redirectTo: `${window.location.origin}/admin/reset-password` }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("The secure reset service took too long to respond. Please try again.")), 15_000)),
      ]);
      if (result.error) return setError(result.error.message ?? "Unable to request a password reset.");
      setMessage("If this email belongs to a CRM account, a reset link has been sent.");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Unable to request a password reset. Please try again.");
    } finally { setLoading(false); }
  };
  return <main className="grid min-h-screen place-items-center bg-[var(--color-page-bg)] px-4"><section className="w-full max-w-md rounded-3xl border bg-[var(--color-card-bg)] p-8 shadow-xl"><Link href="/admin/login" className="text-sm font-bold text-primary hover:underline">← Back to sign in</Link><p className="mt-7 text-sm font-bold uppercase tracking-[.16em] text-primary">Password recovery</p><h1 className="mt-1 text-3xl font-black">Reset your password</h1><p className="mt-2 text-sm text-muted-foreground">We will send a secure password-reset link to your CRM email.</p>{neonAuthEnabled ? <form onSubmit={submit} className="mt-6 space-y-4"><div><Label>Email</Label><Input required type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} className="mt-1" /></div>{error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}{message && <p className="rounded-lg bg-[var(--color-success-soft)] p-3 text-sm text-[var(--color-success)]">{message}</p>}<Button className="w-full" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</Button></form> : <p className="mt-6 rounded-lg bg-[var(--color-warning-soft)] p-3 text-sm">Neon Auth has not been configured.</p>}</section></main>;
}
