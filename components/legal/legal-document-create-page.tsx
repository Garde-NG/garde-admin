"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n/provider";
import { useLegalDocumentActions } from "@/lib/query/legal-documents";
import { LegalDocumentEditor, initialEditorState } from "@/components/legal/legal-document-editor";

export function LegalDocumentCreatePage() {
  const { href, t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const { create } = useLegalDocumentActions();
  const [state, setState] = useState(initialEditorState());

  const submit = () => {
    const incomplete = state.translations.some((entry) => !entry.title.trim() || !entry.content.trim());
    if (incomplete) {
      toast.error(t("legalDocuments.translationRequired"));
      return;
    }
    create.mutate(
      {
        document_type: state.document_type,
        version: state.version,
        effective_date: state.effective_date || undefined,
        translations: state.translations,
      },
      {
        onSuccess: (doc) => {
          toast.success(t("legalDocuments.createSuccess"));
          router.push(href(`/legal-documents/${doc.id}`));
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : t("api.genericFailure")),
      },
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title={t("legalDocuments.createTitle")} />
      <section className="rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
        <LegalDocumentEditor state={state} onChange={setState} onSubmit={submit} submitLabel={t("legalDocuments.createTitle")} pending={create.isPending} />
      </section>
      <Link href={href("/legal-documents")} className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition hover:bg-subtle">
        {t("legalDocuments.backToList")}
      </Link>
    </div>
  );
}
