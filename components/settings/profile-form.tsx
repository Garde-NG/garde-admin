"use client";
import { useState } from "react";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function ProfileForm() {
  const [notice, setNotice] = useState(false);
  return <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); setNotice(true); }}>
    <p className="text-sm text-muted">Account details will appear here once your account is connected.</p>
    {notice && <Alert>Profile saving is not connected yet. Your changes have not been saved.</Alert>}
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="First name" name="firstName" autoComplete="given-name" maxLength={100} required />
      <Field label="Last name" name="lastName" autoComplete="family-name" maxLength={100} required />
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      {["Username", "Email", "Phone", "Role"].map((label) => <Field key={label} label={label} value="" placeholder="Not connected" readOnly hint="Managed by your administrator." />)}
    </div>
    <Button type="submit">Save changes</Button>
  </form>;
}
