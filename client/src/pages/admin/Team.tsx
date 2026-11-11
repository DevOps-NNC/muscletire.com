import { crmMenuItems } from "@/components/CrmNav";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Copy, ShieldCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

const roleLabels = { admin: "Administrator", technician: "Technician", lead_processor: "Lead processor", lead_viewer: "Lead viewer", user: "No CRM access" } as const;
const assignableRoles = ["admin", "technician", "lead_processor", "lead_viewer"] as const;
type StaffAction = { userId: number; action: "suspend" | "restore" | "remove"; name: string };

export default function AdminTeam() {
  const access = trpc.crm.ownerAccess.useQuery();
  const createInvitation = trpc.crm.createAdminInvitation.useMutation({ onSuccess: () => access.refetch() });
  const revokeInvitation = trpc.crm.revokeAdminInvitation.useMutation({ onSuccess: () => access.refetch() });
  const setStaffRole = trpc.crm.setStaffRole.useMutation({ onSuccess: () => { access.refetch(); toast.success("Access level updated"); }, onError: error => toast.error(error.message) });
  const updateStaffAccess = trpc.crm.updateStaffAccess.useMutation({ onSuccess: (_, variables) => { access.refetch(); setPendingAction(null); toast.success(variables.action === "suspend" ? "Team member suspended" : variables.action === "restore" ? "Team member restored" : "CRM access removed"); }, onError: error => toast.error(error.message) });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setInvitationRole] = useState<typeof assignableRoles[number]>("lead_viewer");
  const [generatedLink, setGeneratedLink] = useState("");
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<StaffAction | null>(null);

  const invite = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const result = await createInvitation.mutateAsync({ name, email, role });
      const link = `${window.location.origin}/admin/invite?token=${result.invitation.token}`;
      setGeneratedLink(link);
      setName("");
      setEmail("");
      setInvitationRole("lead_viewer");
    } catch (inviteError: unknown) {
      setError(inviteError instanceof Error ? inviteError.message : "Unable to create invitation.");
    }
  };

  const activeInvitations = useMemo(() => (access.data?.invitations ?? []).filter(item => !item.acceptedAt && !item.revokedAt && new Date(item.expiresAt) > new Date()), [access.data]);
  const confirmAction = () => {
    if (!pendingAction) return;
    updateStaffAccess.mutate({ userId: pendingAction.userId, action: pendingAction.action });
  };
  const actionTitle = pendingAction?.action === "suspend" ? "Suspend team member?" : pendingAction?.action === "restore" ? "Restore team member?" : "Remove CRM access?";
  const actionDescription = pendingAction?.action === "remove"
    ? `${pendingAction.name} will lose CRM access, but their user record and activity history will be preserved.`
    : pendingAction?.action === "suspend"
      ? `${pendingAction.name} will be signed out of the CRM and blocked from returning until access is restored.`
      : `${pendingAction?.name} will be allowed to sign in to the CRM again.`;

  return <DashboardLayout menuItems={crmMenuItems} title="Team access">
    <div className="mx-auto max-w-6xl p-3 md:p-6">
      <div className="mb-8"><p className="text-sm font-bold uppercase tracking-[.16em] text-primary">Owner controls</p><h1 className="mt-1 text-3xl font-black">CRM team access</h1><p className="mt-2 text-muted-foreground">Give each person only the access they need. Lead viewers are read-only; lead processors can work leads without seeing administration or configuration.</p></div>
      {access.isError ? <div className="rounded-2xl border border-[var(--color-warning)] bg-[var(--color-warning-soft)] p-5 text-[var(--color-text-main)]"><h2 className="font-black">Owner access required</h2><p className="mt-2 text-sm">Only the configured CRM owner can manage staff and invitations.</p></div> : <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><ShieldCheck className="h-5 w-5" /></div><div><h2 className="text-xl font-black">Invite a team member</h2><p className="mt-1 text-sm text-muted-foreground">Invitation links expire after seven days.</p></div></div>
          <form onSubmit={invite} className="mt-5 space-y-4"><div><Label>Name</Label><Input required value={name} onChange={event => setName(event.target.value)} className="mt-1 min-h-11" placeholder="Team member name" /></div><div><Label>Email</Label><Input required type="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-1 min-h-11" placeholder="staff@example.com" /></div><div><Label>Access level</Label><select value={role} onChange={event => setInvitationRole(event.target.value as typeof assignableRoles[number])} className="mt-1 min-h-11 w-full rounded-lg border bg-[var(--color-card-bg)] px-3 text-sm font-bold"><option value="lead_viewer">Lead viewer — read only</option><option value="lead_processor">Lead processor — manage leads and quotes</option><option value="technician">Technician — CRM lead processing</option><option value="admin">Administrator — CRM administration</option></select></div>{error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<Button className="min-h-11 w-full" disabled={createInvitation.isPending}>{createInvitation.isPending ? "Creating link…" : "Create secure invitation"}</Button></form>
          {generatedLink && <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="text-sm font-bold">Invitation link ready</p><p className="mt-2 break-all text-xs text-muted-foreground">{generatedLink}</p><Button type="button" variant="outline" className="mt-3 min-h-11" onClick={() => navigator.clipboard.writeText(generatedLink)}><Copy className="mr-2 h-4 w-4" />Copy link</Button></div>}
        </section>
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6"><h2 className="text-xl font-black">Current team</h2><div className="mt-5 divide-y">
          {access.data?.staff.map(person => {
            const editableRole = person.role === "user" ? "lead_viewer" : person.role;
            const isOwner = person.email?.toLowerCase() === access.data?.ownerEmail?.toLowerCase();
            const displayStatus = person.suspendedAt ? "Suspended" : roleLabels[person.role];
            return <div key={person.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{person.name || person.email || "CRM user"}</p><p className="text-sm text-muted-foreground">{person.email || "No email"}</p></div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold ${person.suspendedAt ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]" : "bg-[var(--color-secondary-soft)] text-[var(--color-text-main)]"}`}>{displayStatus}</span>{!isOwner && <><select aria-label={`Access level for ${person.name || person.email || "team member"}`} className="min-h-11 rounded-lg border bg-[var(--color-card-bg)] px-3 text-sm font-bold" value={editableRole} onChange={event => setStaffRole.mutate({ userId: person.id, role: event.target.value as typeof assignableRoles[number] })}>{assignableRoles.map(item => <option key={item} value={item}>{roleLabels[item]}</option>)}</select><Button type="button" size="sm" variant="outline" className="min-h-10" onClick={() => setPendingAction({ userId: person.id, action: person.suspendedAt ? "restore" : "suspend", name: person.name || person.email || "This team member" })}>{person.suspendedAt ? "Restore access" : "Suspend"}</Button><Button type="button" size="sm" variant="outline" className="min-h-10 border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]" onClick={() => setPendingAction({ userId: person.id, action: "remove", name: person.name || person.email || "This team member" })}>Remove access</Button></>}</div></div>;
          })}
          {!access.data?.staff.length && <p className="py-4 text-sm text-muted-foreground">Your CRM users will appear after they sign in.</p>}
        </div><p className="mt-4 text-xs leading-5 text-muted-foreground">Remove access preserves the person’s history and changes their role to No CRM access. Suspension is reversible.</p>
          <h3 className="mt-8 text-base font-black">Active invitations</h3><div className="mt-3 divide-y">{activeInvitations.map(inviteItem => <div key={inviteItem.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{inviteItem.name || inviteItem.email}</p><p className="text-xs text-muted-foreground">{roleLabels[inviteItem.role]} · expires {new Date(inviteItem.expiresAt).toLocaleDateString()}</p></div><Button size="sm" variant="outline" className="min-h-10" onClick={() => revokeInvitation.mutate({ id: inviteItem.id })}>Revoke</Button></div>)}{!activeInvitations.length && <p className="py-3 text-sm text-muted-foreground">No active invitations.</p>}</div>
        </section>
      </div>}
    </div>
    <AlertDialog open={Boolean(pendingAction)} onOpenChange={open => !open && setPendingAction(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{actionTitle}</AlertDialogTitle><AlertDialogDescription>{actionDescription}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmAction} disabled={updateStaffAccess.isPending} className={pendingAction?.action === "remove" ? "bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger)]/90" : ""}>{updateStaffAccess.isPending ? "Updating…" : "Confirm"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </DashboardLayout>;
}
