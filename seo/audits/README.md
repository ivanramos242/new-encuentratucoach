# SEO Audits

## Ejecutar la ingesta integrada

Desde la raiz del repo:

```bash
python seo/scripts/build_integrated_audit.py
```

Si quieres pasar rutas manuales:

```bash
python seo/scripts/build_integrated_audit.py --gsc "C:/ruta/gsc.xlsx" --spider "C:/ruta/spider.xlsx"
```

Salidas generadas en `seo/audits/`:

- `merged_gsc_spyder.csv`
- `issues_summary.csv`
- `redirect_chains.csv`
- `gsc_urls_missing_in_spyder.csv`
- `appendix_integrated_gsc_spyder.xlsx`

## Que significa cada columna

### `merged_gsc_spyder.csv`

- `normalized_url`: URL canonicamente normalizada para cruce entre fuentes.
- `gsc_source_url`: URL original exportada por GSC.
- `spider_source_url`: URL original vista por SEO Spider.
- `in_gsc` / `in_spider`: si la URL existe en cada fuente.
- `clicks`, `impressions`, `ctr`, `position`: metricas de GSC tipadas como numero.
- `status_code`, `content_type`, `indexability`, `indexability_status`: estado del crawl.
- `canonical_url`: canonical normalizada detectada por Spider.
- `meta_robots`, `x_robots_tag`: directivas de indexacion.
- `title`, `meta_description`, `h1`: principales elementos on-page.
- `word_count`, `internal_links`, `unique_internal_links`: senales basicas de contenido y enlazado.
- `redirect_url`, `redirect_type`: destino y tipo de redireccion si aplica.
- `structured_data`, `hreflang`: estado detectado; si Spider no trae esas columnas se marca `UNSPECIFIED`.

### `issues_summary.csv`

- `issue_type`: familia de problema agregada.
- `count`: numero de URLs afectadas.
- `total_clicks`, `total_impressions`: demanda asociada desde GSC.
- `sample_urls`: muestra rapida para revisar.
- `details`: descripcion corta del patron.

### `redirect_chains.csv`

- `source_url`: URL legacy o intermedia donde empieza la cadena.
- `chain_path`: secuencia completa de saltos detectados.
- `hop_count`: numero total de redirecciones antes del destino final.
- `final_url`: destino final.
- `final_status_code`: codigo HTTP final si existe en el crawl.
- `loop_detected`: si hay bucle.

### `gsc_urls_missing_in_spyder.csv`

- `source_url`: URL original de GSC.
- `normalized_url`: URL tras normalizacion.
- `clicks`, `impressions`, `ctr`, `position`: demanda organica para priorizar la investigacion.

## Normalizacion aplicada

- Fuerza `https`.
- Host en minusculas.
- Elimina querystring y fragmento.
- Elimina trailing slash salvo en `/`.

## Uso recomendado con SEO Spider en list mode

1. Exporta desde GSC la pestaña de paginas.
2. Ejecuta el script para generar `gsc_urls_missing_in_spyder.csv`.
3. Copia la columna `source_url` o `normalized_url`.
4. En Screaming Frog usa `Mode > List`.
5. Pega las URLs o importa el CSV.
6. Ejecuta el crawl para confirmar si faltan por enlaces internos, robots, canonicals o redirects.

## Nota operativa

El script lee `.xlsx` sin dependencias externas. Si cambian los nombres de hojas o columnas en futuras exportaciones, revisa primero los encabezados del nuevo archivo antes de ajustar el parser.
