import type { KycStatus, TwoFactorMethod } from "@/lib/auth/types";

export type AdminUserType = "customer" | "admin";

export interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  user_type: AdminUserType;
  is_two_factor_enabled: boolean;
  two_factor_method: TwoFactorMethod | null;
  is_passwordless_enabled: boolean;
  kyc_status: KycStatus | null;
  last_login_at: string | null;
  is_suspended: boolean;
  suspended_at: string | null;
  suspended_reason: string | null;
  is_invite_pending: boolean;
  invited_at: string | null;
  invite_accepted_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUserMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface AdminUserList {
  items: AdminUser[];
  meta: AdminUserMeta;
}

export interface InviteAdminInput {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}
