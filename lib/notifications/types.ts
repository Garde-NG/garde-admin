export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  web_route: string | null;
  mobile_route: string | null;
  params: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface NotificationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface NotificationList {
  items: NotificationItem[];
  meta: NotificationMeta;
}
