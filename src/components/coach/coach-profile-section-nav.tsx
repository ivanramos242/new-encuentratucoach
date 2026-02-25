"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type SectionItem = {
  id: string;
  label: string;
};

function SectionIcon({ id }: { id: string }) {
  const base = { className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
  if (id === "inicio") {
    return (
      <svg {...base}>
        <path d="M4 10.5L12 4l8 6.5V20a2 2 0 01-2 2h-4v-6h-4v6H6a2 2 0 01-2-2v-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "sobre-mi") {
    return (
      <svg {...base}>
        <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5 21a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "galeria") {
    return (
      <svg {...base}>
        <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 14l2.4-2.4a1 1 0 011.4 0L16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="9" cy="9" r="1.2" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (id === "precios") {
    return (
      <svg {...base}>
        <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 9h8M8 12h6M8 15h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...base}>
      <path d="M12 3l2.7 5.4 6 .9-4.3 4.2 1 5.9L12 16.7 6.6 19.4l1-5.9-4.3-4.2 6-.9L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function CoachProfileSectionNav({ sections }: { sections: SectionItem[] }) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");

  useEffect(() => {
    const els = sections
      .map((section) => document.getElementById(section.id))
      .filter(Boolean) as HTMLElement[];
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-22% 0px -58% 0px", threshold: [0.01, 0.15, 0.35] },
    );

    for (const el of els) io.observe(el);
    return () => io.disconnect();
  }, [sections]);

  return (
    <div className="sticky z-30 mt-4 flex justify-center top-[calc(var(--site-header-offset,96px)+8px)]">
      <nav
        className="flex w-full max-w-max gap-1 overflow-x-auto rounded-full border border-black/10 bg-white/95 p-1 shadow-sm backdrop-blur [scrollbar-width:none]"
        aria-label="Secciones del perfil"
      >
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              history.replaceState(null, "", `#${section.id}`);
            }}
            className={cn(
              "inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-2 text-sm font-semibold transition sm:px-4",
              activeId === section.id
                ? "border-cyan-200 bg-cyan-50 text-cyan-900"
                : "border-transparent text-zinc-700 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-900",
            )}
            aria-current={activeId === section.id ? "true" : undefined}
          >
            <SectionIcon id={section.id} />
            {section.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
