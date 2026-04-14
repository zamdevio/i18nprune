import type { PageHeroProps } from "../../types/page-hero";

/**
 * Shared hero shell: grid texture, radial glow, noise, bottom fade — matches home marketing feel.
 */
export default function PageHero({
  eyebrow,
  title,
  description,
  maxWidthClass = "max-w-6xl",
  children,
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-background pb-12 pt-16 sm:pb-16 sm:pt-20 md:pb-20 md:pt-24">
      <div className="absolute inset-0 grid-texture opacity-40" />
      <div className="hero-glow" />
      <div className="noise-overlay absolute inset-0 opacity-80" />

      <div className={`relative z-10 mx-auto ${maxWidthClass} px-4 text-center sm:px-6`}>
        <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-sidebar-primary sm:mb-4 sm:text-xs">
          {eyebrow}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {title}
          </h1>
        </div>
        {description ? (
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:mt-5 md:text-base">
            {description}
          </p>
        ) : null}
        {children ? (
          <div className="mt-6 flex w-full max-w-lg flex-col items-center gap-3 self-center sm:mt-8 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
            {children}
          </div>
        ) : null}
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
