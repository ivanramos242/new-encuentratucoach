import Link from "next/link";
import type { LandingContextLink } from "@/lib/landing-content";

export function ContextLinks({
  links,
  className,
}: {
  links: LandingContextLink[];
  className?: string;
}) {
  if (!links.length) return null;

  return (
    <div className={className}>
      <div className="mt-4 flex flex-wrap gap-2 max-[390px]:gap-1.5">
        {links.slice(0, 6).map((link) => (
          <Link
            key={`${link.label}-${link.href}`}
            href={link.href}
            className="rounded-full border border-black/10 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-white max-[390px]:w-full max-[390px]:text-center sm:text-sm"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
