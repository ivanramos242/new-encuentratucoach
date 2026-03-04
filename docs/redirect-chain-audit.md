# Redirect Chain Audit (SEO)

## Objetivo
Verificar que todas las URLs legacy redirigen con un unico salto (`301`) a la URL canonica final, sin cadenas.

## Fuente de verdad
- Mapa: `docs/redirect-map-template.csv`
- Reglas activas: `next.config.ts` (bloque `redirects`)

## Comprobacion rapida (PowerShell)
```powershell
$base = "https://encuentratucoach.es"
$paths = @(
  "/portal-de-coaches",
  "/coaching-en-espana",
  "/blog-de-coaching",
  "/category/blog",
  "/category/blog/page/2",
  "/membresia-para-coaches",
  "/buscar-coach-madrid",
  "/buscar-coach-en-barcelona",
  "/buscar-coach-en-valencia",
  "/buscar-coach-en-bilbao",
  "/iniciar_sesion",
  "/coaching-que-es"
)

foreach ($path in $paths) {
  $url = "$base$path"
  $response = Invoke-WebRequest -Uri $url -MaximumRedirection 0 -ErrorAction SilentlyContinue
  "{0} -> {1} ({2})" -f $path, $response.Headers.Location, $response.StatusCode
}
```

## Criterio de aprobacion
- Cada URL legacy devuelve `301`.
- `Location` apunta directamente al destino final.
- No hay segundo `301` al seguir la redireccion.
