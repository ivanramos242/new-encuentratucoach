"use client";

import { useEffect } from "react";

export function MembershipCoachLandingEnhancer() {
  useEffect(() => {
    const root = document.getElementById("etcLanding");
    if (!root) return;

    const sticky = document.getElementById("etcSticky");
    const hero = root.querySelector(".hero");

    const showSticky = () => {
      if (!sticky || !hero) return;
      const rect = hero.getBoundingClientRect();
      sticky.style.display = rect.bottom < -30 ? "block" : "none";
    };

    const tocLinks = Array.from(root.querySelectorAll<HTMLAnchorElement>('.toc a[href^="#"]'));
    const sections = tocLinks
      .map((a) => root.querySelector(a.getAttribute("href") ?? ""))
      .filter((item): item is Element => !!item);

    const setActiveToc = () => {
      let currentId: string | null = null;
      for (const section of sections) {
        const r = section.getBoundingClientRect();
        if (r.top <= 120 && r.bottom >= 120) {
          currentId = section.id;
          break;
        }
      }
      tocLinks.forEach((a) => {
        const id = (a.getAttribute("href") ?? "").replace("#", "");
        a.setAttribute("aria-current", id === currentId ? "true" : "false");
      });
    };

    const revealEls = Array.from(
      root.querySelectorAll(
        ".hero-grid > *, .toc, section > .section-head, .section-card, .card, .compare-card, .adv-card, .step, .pricebox, details, .contact-card",
      ),
    );
    revealEls.forEach((el, index) => {
      el.classList.add("reveal");
      (el as HTMLElement).style.setProperty("--d", `${Math.min((index % 6) * 70, 280)}ms`);
    });

    const prefersReducedMotion =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let io: IntersectionObserver | null = null;
    if (prefersReducedMotion || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("is-in"));
    } else {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-in");
            io?.unobserve(entry.target);
          }
        },
        { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
      );
      revealEls.forEach((el) => io?.observe(el));
    }

    window.addEventListener("scroll", showSticky, { passive: true });
    window.addEventListener("scroll", setActiveToc, { passive: true });
    showSticky();
    setActiveToc();

    return () => {
      window.removeEventListener("scroll", showSticky);
      window.removeEventListener("scroll", setActiveToc);
      io?.disconnect();
    };
  }, []);

  return null;
}
