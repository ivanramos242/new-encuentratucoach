import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const modeSchema = z.enum(["dry-run", "commit"]);

function runNodeScript(args: string[], cwd: string) {
  return new Promise<{ exitCode: number; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ exitCode: code ?? 1, stdout, stderr });
    });
  });
}

function tryExtractSummary(stdout: string) {
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(stdout.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let tmpFilePath: string | null = null;
  try {
    const auth = await requireApiRole(request, "admin");
    if (!auth.ok) return auth.response;

    const form = await request.formData();
    const modeRaw = String(form.get("mode") || "dry-run");
    const parsedMode = modeSchema.safeParse(modeRaw);
    if (!parsedMode.success) return jsonError("Modo invalido", 400);

    const mediaFrom = String(form.get("mediaFrom") || "").trim();
    const mediaTo = String(form.get("mediaTo") || "").trim();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("Debes adjuntar un archivo JSON", 400);
    if (!file.name.toLowerCase().endsWith(".json")) return jsonError("El archivo debe ser .json", 400);
    if (file.size <= 0) return jsonError("El archivo est\u00e1 vac\u00edo", 400);
    if (file.size > MAX_UPLOAD_BYTES) {
      return jsonError(`Archivo demasiado grande (m\u00e1ximo ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB)`, 400);
    }

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "etc-wp-coaches-"));
    tmpFilePath = path.join(tempDir, `import-${Date.now()}.json`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(tmpFilePath, buffer);

    const scriptArgs = ["scripts/wp-migration/import-coaches.mjs", "--file", tmpFilePath];
    if (parsedMode.data === "commit") scriptArgs.push("--commit");
    if (mediaFrom && mediaTo) {
      scriptArgs.push("--media-from", mediaFrom, "--media-to", mediaTo);
    }

    const startedAt = Date.now();
    const result = await runNodeScript(scriptArgs, process.cwd());
    const elapsedMs = Date.now() - startedAt;
    const summary = tryExtractSummary(result.stdout);

    if (result.exitCode !== 0) {
      console.error("[admin/import/coaches] script failed", {
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
      });
      return jsonError("La importacion ha fallado", 500, {
        mode: parsedMode.data,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        elapsedMs,
      });
    }

    return jsonOk({
      mode: parsedMode.data,
      exitCode: result.exitCode,
      elapsedMs,
      summary,
      stdout: result.stdout,
      stderr: result.stderr,
      message:
        parsedMode.data === "commit"
          ? "Importacion ejecutada correctamente"
          : "Dry-run ejecutado correctamente",
    });
  } catch (error) {
    console.error("[admin/import/coaches] error", error);
    return jsonError("No se pudo ejecutar la importacion", 500);
  } finally {
    if (tmpFilePath) {
      try {
        await fs.rm(path.dirname(tmpFilePath), { recursive: true, force: true });
      } catch {
        // noop
      }
    }
  }
}

