"use client";
import { Field } from "@/components/ui/field";
import { useUser } from "@/lib/query/user";

export function ProfileForm() {
  const { user } = useUser();
  return <div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="First name" value={user.first_name} readOnly />
      <Field label="Last name" value={user.last_name} readOnly />
      <Field label="Email" value={user.email} readOnly />
      <Field label="Phone" value={user.phone_number ?? "—"} readOnly />
      <Field label="Role" value="Admin" readOnly />
      <Field label="Two-factor authentication" value={user.two_factor_method === "totp" ? "Authenticator app" : "Email verification"} readOnly />
    </div>
    <p className="text-sm text-muted">Contact your administrator to update your account details.</p>
  </div>;
}
