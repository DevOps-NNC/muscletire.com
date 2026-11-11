import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { KeyRound, ShieldAlert } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

export default function RecoverSuperadmin() {
  const [, navigate] = useLocation();
  const status = trpc.auth.recoveryStatus.useQuery();
  const recover = trpc.auth.recoverSuperadmin.useMutation();
  const [email, setEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 12) return setError("Use at least 12 characters for the new permanent password.");
    if (password !== confirm) return setError("Passwords do not match.");
    setError("");
    try {
      await recover.mutateAsync({ email, recoveryCode, password });
      navigate("/admin/login");
    } catch (recoveryError) {
      setError(recoveryError instanceof Error ? recoveryError.message : "Unable to recover administrator access.");
    }
  };

  if (status.isLoading) return <main className="grid min-h-screen place-items-center bg-[var(--color-page-bg)] p-6"><p className="font-bold">Checking secure recovery availability…</p></main>;
  if (!status.data?.available) return <main className="grid min-h-screen place-items-center bg-[var(--color-page-bg)] p-6"><section className="max-w-md rounded-3xl border bg-[var(--color-card-bg)] p-8 text-center shadow-xl"><ShieldAlert className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-4 text-2xl font-black">Recovery is unavailable</h1><p className="mt-3 text-sm text-muted-foreground">The one-time superadmin recovery path has been closed. Use the normal sign-in flow or contact the CRM owner.</p><Link href="/admin/login" className="mt-6 inline-block font-bold text-primary hover:underline">Return to sign in</Link></section></main>;

  return <main className="grid min-h-screen place-items-center bg-[var(--color-page-bg)] px-4 py-12"><section className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-card-bg)] p-8 shadow-xl"><Link href="/admin/login" className="text-sm font-bold text-primary hover:underline">← Back to sign in</Link><div className="mt-7 grid h-12 w-12 place-items-center rounded-xl bg-primary text-[var(--color-text-inverse)]"><KeyRound className="h-6 w-6" /></div><p className="mt-5 text-sm font-bold uppercase tracking-[.16em] text-primary">One-time owner recovery</p><h1 className="mt-1 text-3xl font-black">Restore CRM access</h1><p className="mt-2 text-sm text-muted-foreground">Use the configured owner email and one-time recovery code to set a new permanent password. This path closes after a successful reset.</p><form onSubmit={submit} className="mt-6 space-y-4"><div><Label>Owner email</Label><Input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} className="mt-1" /></div><div><Label>One-time recovery code</Label><Input type="password" autoComplete="off" required value={recoveryCode} onChange={event => setRecoveryCode(event.target.value)} className="mt-1" /></div><div><Label>New permanent password</Label><Input type="password" autoComplete="new-password" required value={password} onChange={event => setPassword(event.target.value)} className="mt-1" /></div><div><Label>Confirm permanent password</Label><Input type="password" autoComplete="new-password" required value={confirm} onChange={event => setConfirm(event.target.value)} className="mt-1" /></div>{error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<Button className="w-full" disabled={recover.isPending}>{recover.isPending ? "Restoring access…" : "Set permanent password"}</Button></form></section></main>;
}
