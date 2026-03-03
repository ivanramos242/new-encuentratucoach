import { Container } from "@/components/layout/container";

export function PageHero({
  title,
  description,
  badge,
  compact = false,
}: {
  title: string;
  description: string;
  badge?: string;
  compact?: boolean;
}) {
  return (
    <section className="relative overflow-hidden border-b border-black/5 bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(10,166,166,0.14),transparent_35%),radial-gradient(circle_at_90%_8%,rgba(41,182,107,0.12),transparent_35%),radial-gradient(circle_at_80%_90%,rgba(20,129,199,0.12),transparent_40%)]" />
      <Container className={compact ? "relative py-8 max-[390px]:py-6 sm:py-10" : "relative py-14 sm:py-16"}>
        {badge ? (
          <p className="mb-4 inline-flex rounded-full border border-black/10 bg-white/90 px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm">
            {badge}
          </p>
        ) : null}
        <h1
          className={
            compact
              ? "max-w-4xl text-2xl font-black tracking-tight text-zinc-950 max-[390px]:text-[1.4rem] sm:text-3xl lg:text-4xl"
              : "max-w-4xl text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl"
          }
        >
          {title}
        </h1>
        <p className={compact ? "mt-3 max-w-3xl text-sm leading-6 text-zinc-700 sm:text-base" : "mt-4 max-w-3xl text-base leading-7 text-zinc-700 sm:text-lg"}>
          {description}
        </p>
      </Container>
    </section>
  );
}
