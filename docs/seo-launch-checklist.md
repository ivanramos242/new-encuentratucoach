# SEO Launch Checklist (Dominio Final)

## Pre-cutover (staging)
- `SEO_ALLOW_INDEXING=false` en staging.
- `robots.txt` en staging bloqueando rastreo completo.
- Validar canónicos y noindex en:
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
- Publicar robots y sitemaps en producción.
- Enviar `/sitemap.xml` en Google Search Console.

## Post-cutover (14 días)
- Revisar cobertura e indexación diariamente.
- Revisar errores de rastreo y soft-404.
- Corregir cadenas de redirección (dejar 1 salto máximo).
- Monitorizar impresiones/clics en queries objetivo por:
  - Ciudad
  - Categoría
  - Categoría + ciudad
  - B2B (`/membresia`, guías de coaches)
