import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { neonAuthClient, neonAuthEnabled } from "@/lib/neonAuth";
import { trpc } from "@/lib/trpc";
import { MailCheck, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

export default function InviteAdmin() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const invitation = trpc.crm.publicInvitation.useQuery({ token }, { enabled: Boolean(token) });
  const accept = trpc.crm.acceptInvitation.useMutation();
  const [name, setName] = useState(""); const [password, setPassword] = useState(""); const [confirmPassword, setConfirmPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!neonAuthClient || !invitation.data?.valid || !invitation.data.email) return;
    if (password.length < 12) return setError("Use at least 12 characters for your password.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    setLoading(true); setError("");
    const created = await neonAuthClient.signUp.email({ name: name || invitation.data.name || invitation.data.email.split("@")[0], email: invitation.data.email, password });
    if (created.error) { setLoading(false); return setError(created.error.message ?? "Unable to create the administrator account."); }
    try {
      await accept.mutateAsync({ token });
      navigate("/admin");
    } catch (acceptError: any) {
      setError(acceptError.message ?? "Account created, but CRM access could not be activated. Please sign in again using this email.");
    } finally { setLoading(false); }
  };
  if (!neonAuthEnabled || invitation.isLoading) return <main className="grid min-h-screen place-items-center bg-[var(--color-page-bg)] p-6"><p className="font-bold">Validating administrator invitation…</p></main>;
  if (!invitation.data?.valid || !invitation.data.email) return <main className="grid min-h-screen place-items-center bg-[var(--color-page-bg)] p-6"><section className="max-w-md rounded-3xl border bg-[var(--color-card-bg)] p-8 text-center shadow-xl"><ShieldCheck className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-4 text-2xl font-black">Invitation unavailable</h1><p className="mt-3 text-sm text-muted-foreground">This administrator invitation is invalid, expired, or already used. Ask the CRM owner for a new invitation.</p><Link href="/admin/login" className="mt-6 inline-block font-bold text-primary hover:underline">Return to sign in</Link></section></main>;
  return <main className="grid min-h-screen place-items-center bg-[var(--color-page-bg)] px-4 py-12"><section className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-card-bg)] p-8 shadow-xl"><div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-[var(--color-text-inverse)]"><MailCheck className="h-6 w-6" /></div><p className="mt-5 text-sm font-bold uppercase tracking-[.16em] text-primary">CRM administrator invitation</p><h1 className="mt-1 text-3xl font-black">Create your access</h1><p className="mt-2 text-sm text-muted-foreground">This invitation is reserved for <strong>{invitation.data.email}</strong>.</p><form onSubmit={submit} className="mt-6 space-y-4"><div><Label>Your name</Label><Input required value={name} onChange={event => setName(event.target.value)} className="mt-1" /></div><div><Label>Administrator email</Label><Input disabled value={invitation.data.email} className="mt-1" /></div><div><Label>New password</Label><Input required type="password" value={password} onChange={event => setPassword(event.target.value)} className="mt-1" /></div><div><Label>Confirm password</Label><Input required type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="mt-1" /></div>{error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating access…" : "Create administrator account"}</Button></form></section></main>;
}
