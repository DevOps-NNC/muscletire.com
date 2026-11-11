import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { neonAuthClient } from "@/lib/neonAuth";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

export default function ResetPassword() {
  const [, navigate] = useLocation(); const token = new URLSearchParams(window.location.search).get("token") ?? ""; const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!neonAuthClient) return; if (password.length < 12) return setError("Use at least 12 characters."); if (password !== confirm) return setError("Passwords do not match."); setLoading(true); setError(""); const result = await (neonAuthClient as any).resetPassword({ newPassword: password, token }); setLoading(false); if (result.error) return setError(result.error.message ?? "Unable to reset password."); navigate("/admin/login"); };
  return <main className="grid min-h-screen place-items-center bg-[var(--color-page-bg)] px-4"><section className="w-full max-w-md rounded-3xl border bg-[var(--color-card-bg)] p-8 shadow-xl"><p className="text-sm font-bold uppercase tracking-[.16em] text-primary">Password recovery</p><h1 className="mt-1 text-3xl font-black">Choose a new password</h1>{!token ? <p className="mt-5 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">This reset link is incomplete or has expired. Request a new link.</p> : <form onSubmit={submit} className="mt-6 space-y-4"><div><Label>New password</Label><Input type="password" required value={password} onChange={event => setPassword(event.target.value)} className="mt-1" /></div><div><Label>Confirm new password</Label><Input type="password" required value={confirm} onChange={event => setConfirm(event.target.value)} className="mt-1" /></div>{error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<Button className="w-full" disabled={loading}>{loading ? "Updating…" : "Update password"}</Button></form>}<Link href="/admin/login" className="mt-6 inline-block text-sm font-bold text-primary hover:underline">Return to sign in</Link></section></main>;
}
