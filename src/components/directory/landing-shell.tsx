import { ContextLinks } from "@/components/directory/context-links";
import { LandingSection } from "@/components/directory/landing-section";
import { TrustStrip } from "@/components/directory/trust-strip";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { getOptionalSessionUser } from "@/lib/auth-server";
import type { LandingContextLink, LandingHeroContent } from "@/lib/landing-content";
import type { DirectoryTrustMetrics } from "@/lib/directory-trust-metrics";

export async function LandingShell({
  hero,
  compactHero = false,
  contextTitle,
  contextDescription,
  contextLinks = [],
  trustStats,
  children,
}: {
  hero: LandingHeroContent;
  compactHero?: boolean;
  contextTitle?: string;
  contextDescription?: string;
  contextLinks?: LandingContextLink[];
  trustStats?: DirectoryTrustMetrics;
  children: React.ReactNode;
}) {
  const sessionUser = await getOptionalSessionUser();
  const isAdmin = sessionUser?.role === "admin";

  return (
    <>
      <PageHero badge={hero.badge} title={hero.title} description={hero.description} compact={compactHero} />
      <PageShell
        className="space-y-7 pt-6 max-[390px]:space-y-6 max-[390px]:pt-5 sm:space-y-9 sm:pt-8 lg:space-y-10 lg:pt-10"
        containerClassName="max-w-[1480px] 2xl:max-w-[1520px]"
      >
        {trustStats && isAdmin ? <TrustStrip stats={trustStats} /> : null}
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
