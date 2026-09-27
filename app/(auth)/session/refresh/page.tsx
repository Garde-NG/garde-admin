"use client";
import { useEffect } from "react";
import { getSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { authRequest, AuthError, messageOf } from "@/lib/auth/client";
import { AuthPanel } from "@/components/auth/auth-panel";
import { Button } from "@/components/ui/button";
import { safeReturnPath } from "@/lib/auth/contracts";

export default function RefreshPage() {
  const query = useQuery({
    queryKey: ["session", "restore"], retry: false, staleTime: 0,
    queryFn: async () => {
      const session = await getSession();
      if (session?.authError === "ServiceUnavailable") throw new Error("The account service is temporarily unavailable.");
      if (session?.authStep !== "authenticated" || session.authError) throw new AuthError(401, "Please sign in again.");
      return authRequest("me");
    },
  });
  useEffect(() => {
    if (query.isSuccess) window.location.replace(safeReturnPath(new URLSearchParams(window.location.search).get("next")));
    if (query.error instanceof AuthError && [401, 403].includes(query.error.status)) window.location.replace("/login?reason=expired");
  }, [query.isSuccess, query.error]);
  return <AuthPanel title="Restoring your session" description={query.error ? messageOf(query.error) : "Please wait a moment…"}>{query.isError && <Button onClick={() => void query.refetch()}>Try again</Button>}</AuthPanel>;
}
