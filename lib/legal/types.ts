export type LegalDocumentType = "terms_and_conditions" | "privacy_policy";
export type LegalDocumentStatus = "draft" | "published" | "archived";

export interface LegalTranslation {
  locale: string;
  title: string;
  content: string;
}

export interface LegalDocument {
  id: string;
  document_type: string;
  version: string;
  status: string;
  effective_date: string | null;
  created_by: string;
  published_by: string | null;
  published_at: string | null;
  translations: LegalTranslation[];
  created_at: string;
  updated_at: string;
}

export interface LegalDocumentMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface LegalDocumentList {
  items: LegalDocument[];
  meta: LegalDocumentMeta;
}

export interface LegalDocumentCreateInput {
  document_type: LegalDocumentType;
  version: string;
  effective_date?: string | null;
  translations: LegalTranslation[];
}

export interface LegalDocumentUpdateInput {
  effective_date?: string | null;
  translations: LegalTranslation[];
}
