"use client";
import { signOut } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n/provider";


export function SignOutButton({ children }: { children?: ReactNode }) {
  const client = useQueryClient();
  const toast = useToast();
  const { href, t } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const logout = useMutation({
    mutationFn: () => signOut({ redirect: false }),
    onSuccess: () => { client.clear(); window.location.replace(href("/login")); },
    onError: () => toast.error(t("shell.signOutFailed")),
  });
  return <>
    <div>
      <button role="menuitem" disabled={logout.isPending} className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted transition hover:bg-subtle hover:text-foreground disabled:opacity-60" onClick={() => setConfirming(true)}>{logout.isPending ? t("shell.signingOut") : children ?? t("shell.signOut")}</button>
    </div>
    <Modal open={confirming} onClose={() => { if (!logout.isPending) setConfirming(false); }} title={t("shell.signOutQuestion")}>
      <div className="space-y-4">
        <p className="text-sm text-muted">{t("shell.signOutConfirm")}</p>
        <ModalActions>
          <Button variant="ghost" disabled={logout.isPending} onClick={() => setConfirming(false)}>{t("common.cancel")}</Button>
          <Button variant="danger" loading={logout.isPending} onClick={() => logout.mutate()}>{t("shell.signOut")}</Button>
        </ModalActions>
      </div>
    </Modal>
  </>;
}
