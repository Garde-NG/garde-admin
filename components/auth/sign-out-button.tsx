"use client";
import { signOut } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";


export function SignOutButton() {
  const client = useQueryClient();
  const logout = useMutation({
    mutationFn: () => signOut({ redirect: false }),
    onSuccess: () => { client.clear(); window.location.replace("/login"); },
  });
  return <div><button role="menuitem" disabled={logout.isPending} className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-subtle" onClick={() => logout.mutate()}>{logout.isPending ? "Signing out…" : "Sign out"}</button>{logout.isError && <p role="alert" className="px-3 text-xs text-danger">Sign-out failed. Please try again.</p>}</div>;
}
