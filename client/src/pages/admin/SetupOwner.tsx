import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { neonAuthClient, neonAuthEnabled } from "@/lib/neonAuth";
import { trpc } from "@/lib/trpc";
import { KeyRound, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

export default function SetupOwner() {
  const [, navigate] = useLocation();
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [confirmPassword, setConfirmPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const status = trpc.auth.setupStatus.useQuery(undefined, { enabled: neonAuthEnabled });
  const canClaim = trpc.auth.canClaimOwner.useMutation();
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!neonAuthClient || !status.data?.accountSetupEnabled) return;
    if (password.length < 8) return setError("Use at least 8 characters for the temporary CRM owner password.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    setLoading(true); setError("");
    const eligibility = await canClaim.mutateAsync({ email });
    if (!eligibility.allowed) { setLoading(false); return setError("This email is not approved to claim the CRM owner account."); }
    const result = await neonAuthClient.signUp.email({ name: name || email.split("@")[0], email, password });
    setLoading(false);
    if (result.error) return setError(result.error.message ?? "Unable to create the owner account.");
    navigate("/admin");
  };
  if (!neonAuthEnabled || status.isLoading) return <main className="grid min-h-screen place-items-center bg-[var(--color-page-bg)] p-6"><p className="font-bold">Checking secure account setup…</p></main>;
  if (!status.data?.accountSetupEnabled) return <main className="grid min-h-screen place-items-center bg-[var(--color-page-bg)] p-6"><section className="max-w-md rounded-3xl border bg-[var(--color-card-bg)] p-8 text-center shadow-xl"><ShieldCheck className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-4 text-2xl font-black">Account setup is closed</h1><p className="mt-3 text-sm text-muted-foreground">Ask the CRM owner for an administrator invitation or sign in with an existing account.</p><Link href="/admin/login" className="mt-6 inline-block font-bold text-primary hover:underline">Return to sign in</Link></section></main>;
  return <main className="grid min-h-screen place-items-center bg-[var(--color-page-bg)] px-4 py-12"><section className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-card-bg)] p-8 shadow-xl"><Link href="/admin/login" className="text-sm font-bold text-primary hover:underline">← Back to sign in</Link><div className="mt-7 grid h-12 w-12 place-items-center rounded-xl bg-primary text-[var(--color-text-inverse)]"><KeyRound className="h-6 w-6" /></div><p className="mt-5 text-sm font-bold uppercase tracking-[.16em] text-primary">One-time owner setup</p><h1 className="mt-1 text-3xl font-black">Secure your CRM</h1><p className="mt-2 text-sm text-muted-foreground">Use the owner email configured for this CRM. You can invite additional administrators after signing in.</p><p className="mt-3 rounded-lg bg-[var(--color-primary-soft)] px-3 py-2 text-sm text-[var(--color-text-main)]">You will be required to replace this temporary password with a permanent password immediately after sign-in.</p><form onSubmit={submit} className="mt-6 space-y-4"><div><Label>Name</Label><Input value={name} onChange={event => setName(event.target.value)} required className="mt-1" /></div><div><Label>Owner email</Label><Input type="email" value={email} onChange={event => setEmail(event.target.value)} required className="mt-1" /></div><div><Label>Temporary password</Label><Input type="password" value={password} onChange={event => setPassword(event.target.value)} required className="mt-1" /></div><div><Label>Confirm temporary password</Label><Input type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required className="mt-1" /></div>{error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}<Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating secure account…" : "Create owner account"}</Button></form></section></main>;
}
