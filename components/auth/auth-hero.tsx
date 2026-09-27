import { Logo, LogoMark } from "@/components/brand/logo";

/**
 * Decorative left half of the auth screens (lg and up). It is always dark,
 * whatever the theme, so text on it uses fixed light colours.
 */
export function AuthHero() {
  return (
    <aside className="relative isolate hidden overflow-hidden bg-[#03110d] text-white lg:sticky lg:top-0 lg:block lg:h-dvh">
      <div aria-hidden className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_48%_42%,rgba(47,207,151,0.24),transparent_36%),linear-gradient(145deg,#03110d_0%,#06251d_52%,#02100c_100%)]" />
      <LogoMark inverse className="absolute left-1/2 top-1/2 -z-10 h-auto w-[min(24rem,48vw)] -translate-x-1/2 -translate-y-1/2 opacity-15" />
      <div aria-hidden className="absolute inset-x-12 top-1/2 -z-10 h-px bg-white/15" />
      <div aria-hidden className="absolute bottom-0 left-0 right-0 -z-10 h-1/3 bg-linear-to-t from-black/50 to-transparent" />

      <div className="flex h-full flex-col justify-between p-8 xl:p-12 2xl:p-16">
        <Logo inverse className="self-start" />

        <div className="max-w-xl space-y-4 pb-2">
          <h2 className="text-balance text-3xl font-semibold leading-[1.1] tracking-tight xl:text-4xl 2xl:text-5xl">
            Your workspace, all in one place.
          </h2>
          <p className="max-w-md text-pretty text-base text-white/75 [@media(max-height:620px)]:hidden xl:text-lg">
            Welcome to Garde. A simpler way to manage your day.
          </p>
        </div>
      </div>
    </aside>
  );
}
