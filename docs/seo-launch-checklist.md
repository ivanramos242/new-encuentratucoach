# SEO Launch Checklist (Dominio Final)

## Pre-cutover (staging)
- `SEO_ALLOW_INDEXING=false` en staging.
- `robots.txt` en staging bloqueando rastreo completo.
- Ejecutar `npm run seo:preflight` con `SEO_PREFLIGHT_SKIP_HTTP=true` para validar guardrails de indexacion.
- Validar canonicos y noindex en:
  - `/coaches?*`
  - `/iniciar-sesion`
  - `/registro`
  - `/recuperar-contrasena`
  - `/pregunta-a-un-coach/buscar`
  - `/pregunta-a-un-coach/tag/*`
- Validar sitemaps 200:
  - `/sitemap.xml`
  - `/sitemap-core.xml`
  - `/sitemap-coaches.xml`
  - `/sitemap-landings.xml`
  - `/sitemap-blog.xml`
  - `/sitemap-qa-questions.xml`
  - `/sitemap-qa-topics.xml`

## Cutover day
- Aplicar redirecciones 301 (1:1) de URLs legacy al destino final.
- Confirmar que no existen redirecciones al home por defecto.
- Cambiar a `SEO_ALLOW_INDEXING=true` en dominio final.
- Publicar robots y sitemaps en produccion.
- Ejecutar `npm run seo:preflight` (sin `SEO_PREFLIGHT_SKIP_HTTP`) y confirmar 200 en robots + sitemaps.
- Enviar `/sitemap.xml` en Google Search Console.

## Post-cutover (14 dias)
- Revisar cobertura e indexacion diariamente.
- Revisar errores de rastreo y soft-404.
- Corregir cadenas de redireccion (dejar 1 salto maximo).
- Monitorizar impresiones/clics en queries objetivo por:
  - Ciudad
  - Categoria
  - Categoria + ciudad
  - B2B (`/membresia`, guias de coaches)

