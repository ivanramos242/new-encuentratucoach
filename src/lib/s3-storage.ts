import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let s3ClientSingleton: S3Client | null = null;

function envBool(value: string | undefined, defaultValue: boolean) {
  if (typeof value !== "string") return defaultValue;
  const v = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(v)) return true;
  if (["0", "false", "no", "off"].includes(v)) return false;
  return defaultValue;
}

export function getS3Client() {
  const endpoint = process.env.S3_PRESIGN_ENDPOINT || process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION || "eu-west-1";
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("S3 storage is not fully configured (S3_ENDPOINT or S3_PRESIGN_ENDPOINT + credentials)");
  }

  if (!s3ClientSingleton) {
    s3ClientSingleton = new S3Client({
      region,
      endpoint,
      forcePathStyle: envBool(process.env.S3_FORCE_PATH_STYLE, true),
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return s3ClientSingleton;
}

function extFromMime(contentType: string) {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "application/pdf":
      return "pdf";
    case "video/mp4":
      return "mp4";
    case "video/webm":
      return "webm";
    default:
      return "bin";
  }
}

export function buildUploadObjectKey(input: {
  scope: "coach_gallery" | "coach_hero" | "coach_video" | "certification_document";
  coachProfileId?: string | null;
  threadId?: string | null;
  fileName?: string | null;
  contentType: string;
}) {
  const safeExt = extFromMime(input.contentType);
  const base = randomUUID();
  const coachId = input.coachProfileId || "unassigned";
  switch (input.scope) {
    case "certification_document":
      return `certifications/${coachId}/${base}.${safeExt}`;
    case "coach_hero":
      return `coach-media/${coachId}/hero/${base}.${safeExt}`;
    case "coach_video":
      return `coach-media/${coachId}/video/${base}.${safeExt}`;
    case "coach_gallery":
    default:
      return `coach-media/${coachId}/gallery/${base}.${safeExt}`;
  }
}

export function resolveBucketByScope(scope: string) {
  if (scope === "certification_document") return process.env.S3_BUCKET_PRIVATE || "etc-private";
  return process.env.S3_BUCKET_PUBLIC || "etc-public";
}

export function isPrivateScope(scope: string) {
  return scope === "certification_document";
}

export async function createPresignedPutUrl(input: {
  bucket: string;
  key: string;
  contentType: string;
  contentLength?: number;
  expiresInSeconds?: number;
}) {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: input.bucket,
    Key: input.key,
    ContentType: input.contentType,
  });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: input.expiresInSeconds ?? 600 });
  return uploadUrl;
}

export async function deleteObjectFromStorage(input: { bucket: string; key: string }) {
  const client = getS3Client();
  const command = new DeleteObjectCommand({
    Bucket: input.bucket,
    Key: input.key,
  });
  await client.send(command);
}

export function buildPublicObjectUrl(bucket: string, key: string) {
  const explicitBase = process.env.S3_PUBLIC_BASE_URL || process.env.S3_PUBLIC_URL;
  if (!explicitBase) return null;
  const base = explicitBase.replace(/\/+$/, "");
  return `${base}/${bucket}/${encodeURI(key).replace(/#/g, "%23")}`;
}

export function parsePublicObjectUrl(inputUrl: string) {
  const explicitBase = process.env.S3_PUBLIC_BASE_URL || process.env.S3_PUBLIC_URL;
  if (!explicitBase) throw new Error("S3_PUBLIC_BASE_URL no configurado");

  const base = explicitBase.replace(/\/+$/, "");
  if (!inputUrl.startsWith(base + "/")) {
    throw new Error("La URL no pertenece al storage publico configurado");
  }

  const rest = inputUrl.slice(base.length + 1);
  const slashIdx = rest.indexOf("/");
  if (slashIdx <= 0) throw new Error("URL de archivo invalida");

  const bucket = rest.slice(0, slashIdx);
  const key = decodeURIComponent(rest.slice(slashIdx + 1));
  if (!bucket || !key) throw new Error("URL de archivo invalida");

  return { bucket, key };
}
