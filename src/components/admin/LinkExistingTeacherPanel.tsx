import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FieldHint } from "@/components/ui/field-help";
import { ArrowLeft, IdCard, Mail, Phone, Search, Send, User } from "lucide-react";
import type { Teacher, UserInvite } from "@/hooks/useTeachers";
import { getLinkableTeachers, resolveLinkInviteEmail } from "@/lib/teacher-link-eligibility";
import { getAccountLinkStatus, ACCOUNT_STATUS_LABEL } from "@/lib/teacher-account-status";

type DeliveryMethod = 'email' | 'whatsapp' | 'both';

interface Props {
  teachers: Teacher[];
  invites: UserInvite[];
  isSending: boolean;
  onCancel: () => void;
  onSend: (p: { teacher: Teacher; email: string; delivery: DeliveryMethod; phone: string | null }) => Promise<void>;
}

export function LinkExistingTeacherPanel({ teachers, invites, isSending, onCancel, onSend }: Props) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [delivery, setDelivery] = useState<DeliveryMethod>("email");
  const [phone, setPhone] = useState("");

  const candidates = useMemo(() => getLinkableTeachers(teachers, query), [teachers, query]);
  const selected = teachers.find(t => t.id === selectedId) ?? null;
  const showPhone = delivery !== 'email';

  if (!selected) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="link-search">Find teacher</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="link-search" placeholder="Search by name or Employee ID" value={query} onChange={e => setQuery(e.target.value)} className="pl-10" />
          </div>
          <FieldHint>Only teachers in your school without a login account are shown.</FieldHint>
        </div>
        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground border rounded-md p-4 text-center">
            {query ? "No unlinked teachers match your search." : "No unlinked teacher records found."}
          </p>
        ) : (
          <div className="border rounded-md max-h-64 overflow-y-auto divide-y">
            {candidates.map(t => {
              const status = getAccountLinkStatus(t, invites);
              return (
                <button type="button" key={t.id} onClick={() => { setSelectedId(t.id); setEmail(t.email ?? ""); }}
                  className="w-full text-left px-3 py-2.5 hover:bg-muted/50 focus:bg-muted/50 focus:outline-none">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{t.name}</span>
                    <Badge variant="outline" className="text-xs shrink-0">{ACCOUNT_STATUS_LABEL[status]}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3">
                    <span>{t.employee_id ?? "No Employee ID"}</span>
                    {t.designation && <span>{t.designation}</span>}
                    {t.department && <span>{t.department}</span>}
                    <span>{t.email ? "Email on file" : "No email on file"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <div className="flex justify-end pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    );
  }

  const status = getAccountLinkStatus(selected, invites);
  const alreadyPending = status === 'invitation_pending' || status === 'invitation_expired';
  const resolvedEmail = resolveLinkInviteEmail(selected.email, email);
  const canSend = !!resolvedEmail && !alreadyPending && (!showPhone || !!phone.trim()) && !isSending;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={selected.name} readOnly disabled className="pl-10" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Employee ID</Label>
        <div className="relative">
          <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={selected.employee_id ?? "—"} readOnly disabled className="pl-10" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="link-email">Invitation email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="link-email" type="email" placeholder="teacher@school.com" value={selected.email ?? email}
            readOnly={!!selected.email} disabled={!!selected.email}
            onChange={e => setEmail(e.target.value)} className="pl-10" />
        </div>
        <FieldHint>{selected.email
          ? "Uses the email saved on this teacher's record."
          : "This record has no email. Enter the address the invitation should go to."}</FieldHint>
      </div>
      <div className="space-y-2">
        <Label>Send invite via</Label>
        <ToggleGroup type="single" value={delivery} onValueChange={v => v && setDelivery(v as DeliveryMethod)} className="justify-start">
          <ToggleGroupItem value="email" className="gap-2"><Mail className="h-4 w-4" />Email</ToggleGroupItem>
          <ToggleGroupItem value="whatsapp" className="gap-2"><Phone className="h-4 w-4" />WhatsApp</ToggleGroupItem>
          <ToggleGroupItem value="both" className="gap-2">Both</ToggleGroupItem>
        </ToggleGroup>
      </div>
      {showPhone && (
        <div className="space-y-2">
          <Label htmlFor="link-phone">WhatsApp Number</Label>
          <Input id="link-phone" type="tel" placeholder="10-digit mobile" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
      )}
      <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
        <p>Current status: <span className="font-medium text-foreground">{ACCOUNT_STATUS_LABEL[status]}</span></p>
        <p>Sending does not grant login access yet. When the teacher accepts, their account is linked to this same record — Employee ID, HR details and assignments stay unchanged.</p>
        {alreadyPending && <p className="text-destructive">An invitation already exists for this teacher. Use Resend or Cancel in Pending Invites.</p>}
      </div>
      <div className="flex justify-between gap-2 pt-2">
        <Button type="button" variant="ghost" className="gap-2" onClick={() => setSelectedId(null)}><ArrowLeft className="h-4 w-4" />Back</Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="button" disabled={!canSend} className="gap-2"
            onClick={() => resolvedEmail && onSend({ teacher: selected, email: resolvedEmail, delivery, phone: phone.trim() || null })}>
            <Send className="h-4 w-4" />{isSending ? "Sending..." : "Send Invite"}
          </Button>
        </div>
      </div>
    </div>
  );
}
