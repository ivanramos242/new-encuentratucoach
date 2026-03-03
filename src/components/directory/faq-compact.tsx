import type { LandingFaqItem } from "@/lib/landing-content";
import { LandingSection } from "@/components/directory/landing-section";

export function FaqCompact({
  title,
  items,
}: {
  title: string;
  items: LandingFaqItem[];
}) {
  if (items.length < 2) return null;

  return (
    <LandingSection title={title}>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <details key={item.q} className="rounded-2xl border border-black/10 bg-zinc-50 p-3.5 sm:p-4">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-900 sm:text-base">{item.q}</summary>
            <p className="mt-2 text-sm leading-6 text-zinc-700">{item.a}</p>
          </details>
        ))}
      </div>
    </LandingSection>
  );
}
