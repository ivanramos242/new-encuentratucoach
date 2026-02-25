"use client";

export function AudioMessagePlayer({ src }: { src: string }) {
  return (
    <audio
      controls
      preload="metadata"
      className="h-10 w-full max-w-64"
      src={src}
    />
  );
}

