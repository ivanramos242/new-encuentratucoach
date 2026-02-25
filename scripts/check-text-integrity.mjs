import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const ROOTS = ["src", "prisma", "scripts"];
const FILE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md"]);
const IGNORE_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage"]);

// Typical mojibake sequences after a UTF-8 -> latin1/cp1252 mismatch.
const MOJIBAKE_RE = /(?:\u00C3[\u0080-\u00BF])|(?:\u00C2[\u0080-\u00BF])|(?:\u00E2[\u0080-\u00BF]{2})|\uFFFD/;
const FORBIDDEN_DISPLAY_RE = /\bEspana\b/;

async function walk(dir, out) {
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, out);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (FILE_EXTS.has(ext)) out.push(full);
  }
}

function formatFinding(file, lineNum, line, label) {
  const rel = path.relative(ROOT, file).replaceAll("\\", "/");
  const preview = line.trim().slice(0, 220);
  return `${rel}:${lineNum}: ${label}: ${preview}`;
}

async function main() {
  const files = [];
  for (const root of ROOTS) {
    await walk(path.join(ROOT, root), files);
  }

  const findings = [];

  for (const file of files) {
    const text = await fs.readFile(file, "utf8");
    const lines = text.split(/\r?\n/);

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (MOJIBAKE_RE.test(line)) {
        findings.push(formatFinding(file, i + 1, line, "possible mojibake"));
      }
      // Uppercase `Espana` is typically display text, not slugs (`espana`).
      if (!file.endsWith("check-text-integrity.mjs") && FORBIDDEN_DISPLAY_RE.test(line)) {
        findings.push(formatFinding(file, i + 1, line, "replace with 'España' (display text)"));
      }
    }
  }

  if (!findings.length) {
    console.log("text integrity check passed");
    return;
  }

  console.error("text integrity check failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
}

await main();
