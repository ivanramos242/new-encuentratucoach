import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";

const port = 3101;
const baseUrl = `http://127.0.0.1:${port}`;
let serverProcess: ChildProcess | null = null;

async function waitForServerReady() {
  const start = Date.now();
  while (Date.now() - start < 60000) {
    try {
      const response = await fetch(`${baseUrl}/`, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {
      // Server still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("SEO smoke server did not start in time.");
}

async function fetchResponse(path: string) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
  const body = await response.text();
  return { response, body };
}

async function assertRedirect(from: string, to: string, expectedStatus = 301) {
  const response = await fetch(`${baseUrl}${from}`, { redirect: "manual" });
  assert.equal(response.status, expectedStatus, `${from} should redirect with ${expectedStatus}`);
  assert.equal(response.headers.get("location"), to, `${from} should redirect to ${to}`);

  const destination = await fetch(`${baseUrl}${to}`, { redirect: "manual" });
  assert.equal(destination.status, 200, `${to} should resolve with 200`);
}

function assertCanonical(body: string, canonicalPath: string) {
  assert.match(
    body,
    new RegExp(`<link rel="canonical" href="https://encuentratucoach\\.es${canonicalPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`),
    `canonical should point to ${canonicalPath}`,
  );
}

function assertRobots(body: string, expected: string) {
  assert.match(body, new RegExp(`<meta name="robots" content="${expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
}

async function main() {
  serverProcess = spawn("cmd.exe", ["/c", "npm", "run", "start", "--", "--port", String(port)], {
    cwd: process.cwd(),
    stdio: "ignore",
    env: { ...process.env, NEXT_PUBLIC_SITE_URL: "https://encuentratucoach.es" },
  });

  try {
    await waitForServerReady();

    await assertRedirect("/contacto/", "/contacto");
    await assertRedirect("/coaches/", "/coaches");
    await assertRedirect("/pregunta-a-un-coach/", "/pregunta-a-un-coach");
    await assertRedirect("/coaches/natalia-tabella/", "/coaches/natalia-tabella");
    await assertRedirect("/portal-de-coaches/", "/coaches");
    await assertRedirect("/membresia-para-coaches/", "/membresia");
    await assertRedirect("/iniciar_sesion/", "/iniciar-sesion");
    await assertRedirect("/buscar-coach-madrid/", "/coaches/ciudad/madrid");
    await assertRedirect("/buscar-coach-en-barcelona/", "/coaches/ciudad/barcelona");
    await assertRedirect("/buscar-coach-en-valencia/", "/coaches/ciudad/valencia");
    await assertRedirect("/coaches_category/personal/", "/coaches/categoria/personal");
    await assertRedirect(
      "/coaches_category/confianza-en-si-mismo/",
      "/coaches/categoria/confianza-en-si-mismo",
    );
    await assertRedirect(
      "/que-es-el-coaching-y-para-que-sirve-guia-clara-con-ejemplos-reales/",
      "/blog/que-es-el-coaching-y-para-que-sirve-guia-clara-con-ejemplos-reales",
    );

    const category = await fetchResponse("/coaches/categoria/personal");
    assert.equal(category.response.status, 200);
    assertCanonical(category.body, "/coaches/categoria/personal");

    const city = await fetchResponse("/coaches/ciudad/madrid");
    assert.equal(city.response.status, 200);
    assertCanonical(city.body, "/coaches/ciudad/madrid");
    assertRobots(city.body, "noindex, follow");

    const categoryCity = await fetchResponse("/coaches/categoria/personal/madrid");
    assert.equal(categoryCity.response.status, 200);
    assertCanonical(categoryCity.body, "/coaches/categoria/personal/madrid");
    assertRobots(categoryCity.body, "noindex, follow");

    const blog = await fetchResponse(
      "/blog/que-es-el-coaching-y-para-que-sirve-guia-clara-con-ejemplos-reales",
    );
    assert.equal(blog.response.status, 200);
    assertCanonical(
      blog.body,
      "/blog/que-es-el-coaching-y-para-que-sirve-guia-clara-con-ejemplos-reales",
    );

    const filteredDirectory = await fetchResponse("/coaches?cat=personal");
    assertCanonical(filteredDirectory.body, "/coaches/categoria/personal");
    assertRobots(filteredDirectory.body, "noindex, follow");

    const paginatedDirectory = await fetchResponse("/coaches?page=2");
    assertCanonical(paginatedDirectory.body, "/coaches");
    assertRobots(paginatedDirectory.body, "noindex, follow");

    const login = await fetchResponse("/iniciar-sesion?returnTo=/coaches");
    assertCanonical(login.body, "/iniciar-sesion");
    assertRobots(login.body, "noindex, follow");

    const register = await fetchResponse("/registro/coach");
    assertCanonical(register.body, "/registro/coach");
    assertRobots(register.body, "noindex, follow");

    const testPage = await fetch(`${baseUrl}/test1`, { redirect: "manual" });
    assert.equal(testPage.status, 410);
    assert.equal(testPage.headers.get("x-robots-tag"), "noindex, nofollow");

    const imageResponse = await fetch(
      `${baseUrl}/_next/image?url=${encodeURIComponent("/favicon.ico")}&w=64&q=75`,
      { redirect: "manual" },
    );
    assert.equal(imageResponse.headers.get("x-robots-tag"), "noindex, nofollow");

    console.log("SEO smoke checks passed.");
  } finally {
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

main().catch((error) => {
  console.error(error);
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(1);
});
