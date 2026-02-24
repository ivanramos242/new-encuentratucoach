import type { NextConfig } from "next";

function remotePatternFromUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      port: url.port || undefined,
    };
  } catch {
    return null;
  }
}

const s3PublicPattern = remotePatternFromUrl(process.env.S3_PUBLIC_BASE_URL);

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "encuentratucoach.es" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "padel-minio.obdyzx.easypanel.host" },
      { protocol: "https", hostname: "**.easypanel.host" },
      ...(s3PublicPattern ? [s3PublicPattern] : []),
    ],
  },
};

export default nextConfig;
