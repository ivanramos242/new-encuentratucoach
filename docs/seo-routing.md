# SEO routing y trailing slash

## Diagnóstico

En local, `Next.js` ya resuelve las URLs con slash final hacia la versión sin slash.

Ejemplos comprobados:

- `/contacto/` -> `/contacto`
- `/coaches/` -> `/coaches`
- `/coaches/natalia-tabella/` -> `/coaches/natalia-tabella`

Eso indica que el split detectado en producción no viene solo de este repo. Lo más probable es que el proxy o la capa legacy esté sirviendo algunas rutas antiguas antes de que la petición llegue a `Next`.

## Regla recomendada en el edge

Objetivo:

1. Priorizar siempre la canónica sin slash.
2. Hacer la redirección en un único salto.
3. Preservar query string.
4. No enviar tráfico a `301 -> 404`.

## Nginx

```nginx
location ~ ^(.+)/$ {
  if ($request_uri !~ "^/$") {
    return 301 $scheme://$host$1$is_args$args;
  }
}

location = /portal-de-coaches {
  return 301 https://encuentratucoach.es/coaches$is_args$args;
}

location = /portal-de-coaches/ {
  return 301 https://encuentratucoach.es/coaches$is_args$args;
}

location = /coaches_category/personal {
  return 301 https://encuentratucoach.es/coaches/categoria/personal$is_args$args;
}

location = /coaches_category/personal/ {
  return 301 https://encuentratucoach.es/coaches/categoria/personal$is_args$args;
}
```

## Cloudflare Rules

Crear reglas de redirección con prioridad alta:

1. Si la ruta coincide con una URL legacy conocida, redirigir al destino canónico sin slash.
2. Si la ruta termina en `/` y no es `/`, redirigir a la misma ruta sin `/`.

La regla de URLs legacy debe ejecutarse antes que la regla genérica para evitar cadenas.

## Vercel

Si el tráfico entra directo por Vercel, mantener la lógica en `src/proxy.ts` y evitar reglas externas que reescriban a WordPress u otro origen para las rutas públicas.

## Qué no hacer

- No aplicar una regla genérica de “quitar slash” sobre rutas desconocidas si el destino puede devolver `404`.
- No dejar que WordPress o una app legacy responda `200` en rutas con slash mientras `Next` responde otra versión sin slash.
- No usar solo `robots.txt` para “desindexar” endpoints internos. Para eso se usan `meta robots` o `X-Robots-Tag`.
