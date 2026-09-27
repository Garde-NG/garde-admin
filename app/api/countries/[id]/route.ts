import { NextRequest } from "next/server";
import { requireApiAccount } from "../../_lib/account";
import { localeFromRequest } from "../../_lib/request-locale";
import { upstreamRequest } from "../../_lib/upstream";
import { jsonError, jsonOk, noContent } from "../../_lib/respond";
import type { Country, CountryInput } from "@/lib/countries/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const locale = localeFromRequest(request);
  try {
    const { id } = await context.params;
    const { token } = await requireApiAccount(locale);
    const data = await upstreamRequest<Country>("countries", id, {
      accessToken: token.tokens!.access_token,
      locale,
    });
    return jsonOk(data);
  } catch (error) {
    return jsonError(error, locale, (dict) => dict.api.genericFailure);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const locale = localeFromRequest(request);
  try {
    const { id } = await context.params;
    const { token } = await requireApiAccount(locale);
    const body = (await request.json()) as Partial<CountryInput>;
    const data = await upstreamRequest<Country>("countries", id, {
      accessToken: token.tokens!.access_token,
      locale,
      method: "PATCH",
      body,
    });
    return jsonOk(data);
  } catch (error) {
    return jsonError(error, locale, (dict) => dict.api.genericFailure);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const locale = localeFromRequest(request);
  try {
    const { id } = await context.params;
    const { token } = await requireApiAccount(locale);
    await upstreamRequest("countries", id, {
      accessToken: token.tokens!.access_token,
      locale,
      method: "DELETE",
    });
    return noContent();
  } catch (error) {
    return jsonError(error, locale, (dict) => dict.api.genericFailure);
  }
}
