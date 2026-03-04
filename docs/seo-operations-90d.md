# SEO Operations - 90 dias (B2C dominante)

## KPIs primarios
- Clics organicos (Search Console) en:
  - `/coaches`
  - `/coaches/ciudad/*`
  - `/coaches/categoria/*`
  - `/coaches/*slug*`

## KPIs secundarios
- Impresiones organicas
- CTR medio por URL
- URLs indexadas validas (landings canonicas)
- Eventos internos:
  - `view_profile`
  - `click_contact`
  - `click_whatsapp`
  - `submit_form`

## Cadencia semanal
1. Exportar Search Console por pagina + query.
2. Detectar URLs con:
   - Posicion 6-20
   - Impresiones altas y CTR bajo
3. Priorizar ajustes de title/meta y enlazado interno en esas URLs.

## Cadencia quincenal
1. Revisar eventos de funnel en BD (tabla `DirectoryFunnelEvent`).
2. Evaluar por `metadata.sourcePath` y `metadata.sourceModule`:
   - Que landings generan visitas sin clic
   - Que landings generan clics de contacto

## Cadencia mensual
1. Podar o reforzar landings segun rendimiento.
2. Revisar posibles canibalizaciones tematicas.
3. Actualizar `docs/redirect-map-template.csv` si aparecen nuevas rutas legacy.
