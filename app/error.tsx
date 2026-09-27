"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function AppError({ reset }: { reset: () => void }) {
  return <main className="m-auto max-w-md space-y-4 p-8"><h1 className="text-xl font-semibold">Unable to load your account</h1><p className="text-sm text-muted">The account service is unavailable. Please try again shortly.</p><div className="flex items-center gap-4"><Button onClick={reset}>Try again</Button><Link href="/login" className="text-sm text-brand">Back to sign in</Link></div></main>;
}
