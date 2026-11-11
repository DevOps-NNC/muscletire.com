import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Archive, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export type LeadLifecycleAction = "archive" | "soft_delete" | "restore" | "permanent_delete";

const actionCopy: Record<LeadLifecycleAction, { title: string; description: string; button: string; icon: typeof Archive; destructive?: boolean }> = {
  archive: { title: "Archive this lead?", description: "The lead will leave the active pipeline and remain available in Lead Recovery.", button: "Archive lead", icon: Archive },
  soft_delete: { title: "Move this lead to deleted records?", description: "The lead will be removed from the active pipeline but can still be restored from Lead Recovery.", button: "Soft-delete lead", icon: Trash2, destructive: true },
  restore: { title: "Restore this lead?", description: "The lead will return to the active pipeline and be available for normal follow-up.", button: "Restore lead", icon: RotateCcw },
  permanent_delete: { title: "Permanently delete this lead?", description: "This cannot be undone. Lead details, internal activity, handoff history, files, appointments, and service summaries connected to this recovery record will be erased.", button: "Permanently delete", icon: AlertTriangle, destructive: true },
};

export function LeadLifecycleConfirmDialog({ open, action, onOpenChange, onConfirm, isPending }: { open: boolean; action: LeadLifecycleAction | null; onOpenChange: (open: boolean) => void; onConfirm: () => void; isPending?: boolean }) {
  const [confirmation, setConfirmation] = useState("");
  useEffect(() => { if (!open) setConfirmation(""); }, [open]);
  if (!action) return null;
  const copy = actionCopy[action];
  const Icon = copy.icon;
  const needsTypedConfirmation = action === "permanent_delete";
  const canConfirm = !needsTypedConfirmation || confirmation.trim().toUpperCase() === "DELETE";
  return <AlertDialog open={open} onOpenChange={onOpenChange}><AlertDialogContent className="max-w-md rounded-3xl p-5 sm:p-6"><AlertDialogHeader><div className={`mb-2 grid h-11 w-11 place-items-center rounded-2xl ${copy.destructive ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}><Icon className="h-5 w-5" /></div><AlertDialogTitle className="text-xl font-black">{copy.title}</AlertDialogTitle><AlertDialogDescription className="leading-6">{copy.description}</AlertDialogDescription></AlertDialogHeader>{needsTypedConfirmation && <label className="block"><span className="text-sm font-bold text-foreground">Type <strong>DELETE</strong> to continue</span><Input value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" className="mt-2 min-h-11" placeholder="DELETE" /></label>}<AlertDialogFooter className="mt-2"><AlertDialogCancel disabled={isPending} className="min-h-11">Keep lead</AlertDialogCancel><AlertDialogAction asChild><Button onClick={onConfirm} disabled={isPending || !canConfirm} className={`min-h-11 ${copy.destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}`}>{isPending ? "Working…" : copy.button}</Button></AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
