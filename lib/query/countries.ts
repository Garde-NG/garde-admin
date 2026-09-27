"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createApiRequest } from "./api-client";
import type { Country, CountryInput, CountryList } from "@/lib/countries/types";

const countriesRequest = createApiRequest("/api/countries");

export const countriesKey = ["countries"] as const;

export interface CountryListParams {
  page?: number;
  pageSize?: number;
}

function listPath(params: CountryListParams = {}) {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("page_size", String(params.pageSize ?? 20));
  return `?${search}`;
}

export function countriesListKey(params: CountryListParams = {}) {
  return [...countriesKey, params] as const;
}

export function useCountries(params: CountryListParams = {}) {
  return useQuery({
    queryKey: countriesListKey(params),
    queryFn: () => countriesRequest<CountryList>(listPath(params)),
    staleTime: 60000,
  });
}

export function useCountryActions() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: countriesKey });

  const create = useMutation({
    mutationFn: (input: CountryInput) => countriesRequest<Country>("", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CountryInput> }) =>
      countriesRequest<Country>(`/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => countriesRequest<void>(`/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
