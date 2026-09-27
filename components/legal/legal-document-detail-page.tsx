"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfigPageHeader, ErrorState } from "@/components/dashboard/screen-kit";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/ui/modal";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n/provider";
import { useLegalDocument, useLegalDocumentActions } from "@/lib/query/legal-documents";
import { LegalDocumentEditor, initialEditorState, type LegalEditorState } from "@/components/legal/legal-document-editor";
import { LegalStatusBadge } from "@/components/legal/legal-status-badge";

function formatDateTime(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function LegalDocumentDetailPage({ id }: { id: string }) {
  const { href, t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const query = useLegalDocument(id);
  const { update, publish, remove } = useLegalDocumentActions();
  const doc = query.data;
  const [state, setState] = useState<LegalEditorState | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (doc && loadedId !== doc.id) {
    setLoadedId(doc.id);
    setState(initialEditorState(doc));
  }

  const onError = (error: unknown) => toast.error(error instanceof Error ? error.message : t("api.genericFailure"));

  const submit = () => {
    if (!doc || !state) return;
    const incomplete = state.translations.some((entry) => !entry.title.trim() || !entry.content.trim());
    if (incomplete) {
      toast.error(t("legalDocuments.translationRequired"));
      return;
    }
    update.mutate(
      { id: doc.id, input: { effective_date: state.effective_date || undefined, translations: state.translations } },
      { onSuccess: () => toast.success(t("legalDocuments.saveSuccess")), onError },
    );
  };

  const isDraft = doc?.status === "draft";

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <ConfigPageHeader
        icon="clipboard"
        backHref="/legal-documents"
        backLabel={t("legalDocuments.title")}
        title={t("legalDocuments.viewTitle")}
        description={doc ? `${doc.document_type === "terms_and_conditions" ? t("legalDocuments.termsAndConditions") : t("legalDocuments.privacyPolicy")} · v${doc.version}` : undefined}
      />

      {query.isLoading || !state ? (
        <div className="h-96 animate-pulse rounded-2xl border border-border bg-subtle/40" />
      ) : query.isError ? (
        <section className="rounded-2xl border border-border bg-surface shadow-card">
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        </section>
      ) : doc ? (
        <>
          <section className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <LegalStatusBadge status={doc.status} />
                {doc.published_at && <span className="text-xs text-muted">{t("legalDocuments.publishedAt")}: {formatDateTime(doc.published_at)}</span>}
              </div>
              {isDraft ? (
                <div className="flex gap-2">
                  <Button variant="secondary" className="text-danger hover:bg-danger-soft" onClick={() => setDeleteOpen(true)}>{t("legalDocuments.deleteDraft")}</Button>
                  <Button onClick={() => setPublishOpen(true)}>{t("legalDocuments.publish")}</Button>
                </div>
              ) : null}
            </div>

            {!isDraft && <Alert tone="info">{t("legalDocuments.readOnlyNotice")}</Alert>}

            <LegalDocumentEditor
              state={state}
              onChange={setState}
              lockDocumentType
              disabled={!isDraft}
              onSubmit={submit}
              submitLabel={t("common.save")}
              pending={update.isPending}
            />
          </section>
        </>
      ) : null}

      <Modal open={publishOpen} onClose={() => setPublishOpen(false)} title={t("legalDocuments.publishConfirmTitle")}>
        <p className="text-sm text-muted">{t("legalDocuments.publishConfirmBody")}</p>
        <ModalActions>
          <Button variant="secondary" onClick={() => setPublishOpen(false)} disabled={publish.isPending}>{t("common.cancel")}</Button>
          <Button
            loading={publish.isPending}
            onClick={() =>
              doc &&
              publish.mutate(doc.id, {
                onSuccess: () => { toast.success(t("legalDocuments.publishSuccess")); setPublishOpen(false); },
                onError,
              })
            }
          >
            {t("legalDocuments.publish")}
          </Button>
        </ModalActions>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title={t("legalDocuments.deleteConfirmTitle")}>
        <p className="text-sm text-muted">{t("legalDocuments.deleteConfirmBody")}</p>
        <ModalActions>
          <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={remove.isPending}>{t("common.cancel")}</Button>
          <Button
            variant="danger"
            loading={remove.isPending}
            onClick={() =>
              doc &&
              remove.mutate(doc.id, {
                onSuccess: () => {
                  toast.success(t("legalDocuments.deleteSuccess"));
                  router.push(href("/legal-documents"));
                },
                onError,
              })
            }
          >
            {t("legalDocuments.deleteDraft")}
          </Button>
        </ModalActions>
      </Modal>
    </div>
  );
}
