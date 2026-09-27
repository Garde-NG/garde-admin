import Link from "next/link";
import { getLocalizedPath, getServerDictionary } from "@/lib/i18n/server";

export default async function NotFound() {
  const dict = await getServerDictionary();
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <p className="mb-3 text-sm font-semibold text-brand">404</p>
        <h1 className="text-3xl font-semibold tracking-tight">{dict.notFound.title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{dict.notFound.description}</p>
        <div className="mt-8 flex justify-center">
          <Link href={await getLocalizedPath("/dashboard")} className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
            {dict.notFound.action}
          </Link>
        </div>
      </div>
    </main>
  );
}
