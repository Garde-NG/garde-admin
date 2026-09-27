"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createApiRequest } from "./api-client";
import type {
  LegalDocument,
  LegalDocumentCreateInput,
  LegalDocumentList,
  LegalDocumentUpdateInput,
} from "@/lib/legal/types";

const legalRequest = createApiRequest("/api/legal-documents");

export const legalDocumentsKey = ["legal-documents"] as const;

export interface LegalDocumentListParams {
  page?: number;
  pageSize?: number;
  documentType?: string;
  status?: string;
}

function listPath(params: LegalDocumentListParams = {}) {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("page_size", String(params.pageSize ?? 20));
  if (params.documentType) search.set("document_type", params.documentType);
  if (params.status) search.set("status", params.status);
  return `?${search}`;
}

export function legalDocumentsListKey(params: LegalDocumentListParams = {}) {
  return [...legalDocumentsKey, params] as const;
}

export function useLegalDocuments(params: LegalDocumentListParams = {}) {
  return useQuery({
    queryKey: legalDocumentsListKey(params),
    queryFn: () => legalRequest<LegalDocumentList>(listPath(params)),
    staleTime: 15000,
  });
}

export function useLegalDocument(id: string | undefined) {
  return useQuery({
    queryKey: [...legalDocumentsKey, "detail", id],
    queryFn: () => legalRequest<LegalDocument>(`/${id}`),
    enabled: Boolean(id),
    staleTime: 15000,
  });
}

export function useLegalDocumentActions() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: legalDocumentsKey });

  const create = useMutation({
    mutationFn: (input: LegalDocumentCreateInput) => legalRequest<LegalDocument>("", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: LegalDocumentUpdateInput }) =>
      legalRequest<LegalDocument>(`/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (data) => {
      client.setQueryData([...legalDocumentsKey, "detail", data.id], data);
      invalidate();
    },
  });

  const publish = useMutation({
    mutationFn: (id: string) => legalRequest<LegalDocument>(`/${id}/publish`, { method: "POST" }),
    onSuccess: (data) => {
      client.setQueryData([...legalDocumentsKey, "detail", data.id], data);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => legalRequest<void>(`/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });

  return { create, update, publish, remove };
}
