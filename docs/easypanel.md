# Despliegue en Easypanel (Hostinger VPS)

## Servicios recomendados
- `web`: app Next.js usando el `Dockerfile` del repo
- `postgres`: PostgreSQL 16 con volumen persistente
- `minio`: almacenamiento S3-compatible para media pública/privada

## Variables de entorno mínimas
- `NEXT_PUBLIC_SITE_URL`
- `DATABASE_URL`
- `AUTH_*`
- `SMTP_*`
- `STRIPE_*`
- `S3_*`

## Pasos iniciales
1. Crear servicio `postgres` y copiar `DATABASE_URL`.
2. Crear servicio `minio` y buckets `etc-public` / `etc-private`.
3. Crear servicio `web` desde este repo.
4. Configurar dominio temporal con HTTPS.
5. Ejecutar `prisma migrate deploy` y `npm run prisma:generate`.
6. Verificar `/`, `/coaches`, `/blog`, `/sitemap.xml` y `/robots.txt`.

## Backups
- PostgreSQL: backup diario
- MinIO: snapshot o sincronización externa
