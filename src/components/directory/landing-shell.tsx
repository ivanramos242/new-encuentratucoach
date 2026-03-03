import { ContextLinks } from "@/components/directory/context-links";
import { LandingSection } from "@/components/directory/landing-section";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import type { LandingContextLink, LandingHeroContent } from "@/lib/landing-content";

export function LandingShell({
  hero,
  compactHero = false,
  contextTitle,
  contextDescription,
  contextLinks = [],
  children,
}: {
  hero: LandingHeroContent;
  compactHero?: boolean;
  contextTitle?: string;
  contextDescription?: string;
  contextLinks?: LandingContextLink[];
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHero badge={hero.badge} title={hero.title} description={hero.description} compact={compactHero} />
      <PageShell
        className="space-y-7 pt-6 max-[390px]:space-y-6 max-[390px]:pt-5 sm:space-y-9 sm:pt-8 lg:space-y-10 lg:pt-10"
        containerClassName="max-w-[1480px] 2xl:max-w-[1520px]"
      >
        {contextTitle ? (
          <LandingSection title={contextTitle} description={contextDescription}>
            <ContextLinks links={contextLinks} />
          </LandingSection>
        ) : null}
        {children}
      </PageShell>
    </>
  );
}
