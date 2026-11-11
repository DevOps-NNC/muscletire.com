import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { neonAuthClient, neonAuthEnabled } from "@/lib/neonAuth";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

export default function AdminSignIn() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!neonAuthClient) {
      setError("Email/password sign-in is not configured yet.");
      return;
    }
    setLoading(true); setError("");
    try {
      const result = await Promise.race([
        neonAuthClient.signIn.email({ email, password }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("The secure sign-in service took too long to respond. Please try again.")), 15_000)),
      ]);
      if (result.error) { setError(result.error.message ?? "Unable to sign in. Please try again."); return; }
      navigate("/admin");
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Unable to reach the secure sign-in service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fieldClassName = "mt-1 min-h-12 border-[var(--color-border)] bg-[var(--color-card-bg)] text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] focus-visible:ring-primary";
  return <main className="grid min-h-screen place-items-center bg-[var(--color-page-bg)] px-4 py-12"><section className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-card-bg)] p-8 shadow-xl"><Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Back to website</Link><div className="mt-7 grid h-12 w-12 place-items-center rounded-xl bg-primary text-[var(--color-text-inverse)]"><LockKeyhole className="h-6 w-6" /></div><p className="mt-5 text-sm font-bold uppercase tracking-[.16em] text-primary">New Age CRM</p><h1 className="mt-1 text-3xl font-black">Sign in to your workspace</h1><form onSubmit={submit} className="mt-7 space-y-4"><div><Label>Email</Label><Input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClassName} /></div><div><Label>Password</Label><Input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className={fieldClassName} /></div>{error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}<Button type="submit" disabled={loading || !neonAuthEnabled} className="w-full">{loading ? "Signing in…" : "Sign in"}</Button></form><div className="mt-5 text-sm font-bold"><Link href="/admin/forgot-password" className="text-primary hover:underline">Forgot password?</Link></div>{!neonAuthEnabled && <div className="mt-5 rounded-xl border border-[var(--color-warning)] bg-[var(--color-warning-soft)] p-4 text-sm leading-6 text-[var(--color-text-main)]">Email/password sign-in is not configured. Add <code className="rounded bg-[var(--color-card-bg)] px-1">VITE_NEON_AUTH_URL</code> from the Neon Auth configuration screen, then enable email/password or an OAuth provider in Neon.</div>}</section></main>;
}
