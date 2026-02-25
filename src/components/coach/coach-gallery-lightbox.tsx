"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function CoachGalleryLightbox({
  coachName,
  heroImageUrl,
  galleryImageUrls,
}: {
  coachName: string;
  heroImageUrl: string;
  galleryImageUrls: string[];
}) {
  const images = galleryImageUrls.length ? galleryImageUrls : [heroImageUrl];
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (images.length > 1) {
        if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
        if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, images.length]);

  return (
    <>
      {galleryImageUrls.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {galleryImageUrls.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => {
                setIndex(i);
                setOpen(true);
              }}
              className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-black/10 bg-zinc-100 text-left"
            >
              <Image src={src} alt={`Galería ${i + 1} de ${coachName}`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-black/15 bg-zinc-50 p-4 text-sm text-zinc-700">
          Este coach todavía no ha subido imágenes.
        </div>
      )}

      {open ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-3"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-5xl rounded-3xl border border-white/20 bg-white p-3 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black tracking-tight text-zinc-950">Galería de {coachName}</p>
                <p className="text-xs font-semibold text-zinc-600">{index + 1} de {images.length}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-zinc-900" aria-label="Cerrar">
                ✕
              </button>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-zinc-950">
              <div className="relative aspect-[16/10]">
                <Image src={images[index]} alt={`Imagen ${index + 1} de ${coachName}`} fill className="object-contain" sizes="100vw" />
              </div>
              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white"
                    aria-label="Anterior"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => setIndex((i) => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white"
                    aria-label="Siguiente"
                  >
                    ›
                  </button>
                </>
              ) : null}
            </div>

            {images.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={cn("relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border bg-zinc-100", i === index ? "border-cyan-400 ring-2 ring-cyan-200" : "border-black/10")}
                  >
                    <Image src={src} alt={`Miniatura ${i + 1}`} fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
