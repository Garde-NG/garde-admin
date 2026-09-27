export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  email: string;
  event_type: string;
  description: string;
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
  event_metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditLogMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface AuditLogList {
  items: AuditLogEntry[];
  meta: AuditLogMeta;
}
