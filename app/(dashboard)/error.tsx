"use client";
import { Button } from "@/components/ui/button";
export default function DashboardError({ reset }: { reset: () => void }) {
  return <div className="mx-auto max-w-md space-y-4 p-8"><h1 className="text-xl font-semibold">Unable to load your account</h1><p className="text-sm text-muted">The service may be temporarily unavailable. Please try again.</p><Button onClick={reset}>Try again</Button></div>;
}
