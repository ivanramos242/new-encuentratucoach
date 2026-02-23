import { Container } from "@/components/layout/container";

export function PageHero({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-black/5 bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(10,166,166,0.14),transparent_35%),radial-gradient(circle_at_90%_8%,rgba(41,182,107,0.12),transparent_35%),radial-gradient(circle_at_80%_90%,rgba(20,129,199,0.12),transparent_40%)]" />
      <Container className="relative py-14 sm:py-16">
        {badge ? (
          <p className="mb-4 inline-flex rounded-full border border-black/10 bg-white/90 px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm">
            {badge}
          </p>
        ) : null}
        <h1 className="max-w-4xl text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-700 sm:text-lg">{description}</p>
      </Container>
    </section>
  );
}
