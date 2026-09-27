"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createApiRequest } from "./api-client";
import type { AdminUser, AdminUserList, InviteAdminInput } from "@/lib/users/types";

const usersRequest = createApiRequest("/api/users");

export const usersKey = ["users"] as const;

export interface UserListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  userType?: "customer" | "admin";
  isSuspended?: boolean;
  includeDeleted?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  sortBy?: "created_at" | "last_login_at" | "email" | "first_name" | "last_name";
  sortOrder?: "asc" | "desc";
}

function listPath(params: UserListParams = {}) {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("page_size", String(params.pageSize ?? 20));
  if (params.q) search.set("q", params.q);
  if (params.userType) search.set("user_type", params.userType);
  if (params.isSuspended !== undefined) search.set("is_suspended", String(params.isSuspended));
  if (params.includeDeleted) search.set("include_deleted", String(params.includeDeleted));
  if (params.createdAfter) search.set("created_after", params.createdAfter);
  if (params.createdBefore) search.set("created_before", params.createdBefore);
  if (params.sortBy) search.set("sort_by", params.sortBy);
  if (params.sortOrder) search.set("sort_order", params.sortOrder);
  return `?${search}`;
}

export function usersListKey(params: UserListParams = {}) {
  return [...usersKey, params] as const;
}

export function useUsers(params: UserListParams = {}) {
  return useQuery({
    queryKey: usersListKey(params),
    queryFn: () => usersRequest<AdminUserList>(listPath(params)),
    staleTime: 15000,
  });
}

export function useAdminUser(id: string | undefined) {
  return useQuery({
    queryKey: [...usersKey, "detail", id],
    queryFn: () => usersRequest<AdminUser>(`/${id}`),
    enabled: Boolean(id),
    staleTime: 15000,
  });
}

export function useUserActions() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: usersKey });
  const patch = (user: AdminUser) => {
    client.setQueryData([...usersKey, "detail", user.id], user);
    client.setQueriesData<AdminUserList>({ queryKey: usersKey }, (current) =>
      current ? { ...current, items: current.items.map((item) => (item.id === user.id ? user : item)) } : current,
    );
  };

  const invite = useMutation({
    mutationFn: (input: InviteAdminInput) => usersRequest<AdminUser>("/invite", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: invalidate,
  });

  const resendInvite = useMutation({
    mutationFn: (id: string) => usersRequest<void>(`/${id}/resend-invite`, { method: "POST" }),
  });

  const suspend = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      usersRequest<AdminUser>(`/${id}/suspend`, { method: "POST", body: JSON.stringify({ reason }) }),
    onSuccess: patch,
  });

  const unsuspend = useMutation({
    mutationFn: (id: string) => usersRequest<AdminUser>(`/${id}/unsuspend`, { method: "POST" }),
    onSuccess: patch,
  });

  const remove = useMutation({
    mutationFn: (id: string) => usersRequest<void>(`/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });

  const restore = useMutation({
    mutationFn: (id: string) => usersRequest<AdminUser>(`/${id}/restore`, { method: "POST" }),
    onSuccess: patch,
  });

  return { invite, resendInvite, suspend, unsuspend, remove, restore };
}
