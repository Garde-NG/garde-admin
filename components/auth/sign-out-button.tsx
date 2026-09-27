"use client";
import { signOut } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";


export function SignOutButton({ children = "Sign out" }: { children?: ReactNode }) {
  const client = useQueryClient();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const logout = useMutation({
    mutationFn: () => signOut({ redirect: false }),
    onSuccess: () => { client.clear(); window.location.replace("/login"); },
    onError: () => toast.error("Sign-out failed. Please try again."),
  });
  return <>
    <div>
      <button role="menuitem" disabled={logout.isPending} className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted transition hover:bg-subtle hover:text-foreground disabled:opacity-60" onClick={() => setConfirming(true)}>{logout.isPending ? "Signing out..." : children}</button>
    </div>
    <Modal open={confirming} onClose={() => { if (!logout.isPending) setConfirming(false); }} title="Sign out?">
      <div className="space-y-4">
        <p className="text-sm text-muted">Are you sure you want to sign out of your Garde admin account?</p>
        <ModalActions>
          <Button variant="ghost" disabled={logout.isPending} onClick={() => setConfirming(false)}>Cancel</Button>
          <Button variant="danger" loading={logout.isPending} onClick={() => logout.mutate()}>Sign out</Button>
        </ModalActions>
      </div>
    </Modal>
  </>;
}
