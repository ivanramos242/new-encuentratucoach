# Security Hardening Checklist (Producción)

Checklist operativo para ejecutar el hardening sin cambiar funciones ni esquema DB.

## Fase 0: Dinero y datos (48h)

### Backups y restore
- [ ] PostgreSQL: backup diario + retención `7d / 4w / 3m`
- [ ] PostgreSQL: snapshot de volumen y/o PITR (si disponible)
- [ ] MinIO: versionado activado en `etc-public` y `etc-private`
- [ ] MinIO: sync/backup externo diario
- [ ] Restore test en entorno separado (DB + archivos)
- [ ] Registrar RPO objetivo (`<=24h`, ideal `<=1h`)
- [ ] Registrar RTO objetivo (`<=4h`)

### Secretos y acceso
- [ ] Rotar `STRIPE_*`
- [ ] Rotar `SMTP_*`
- [ ] Rotar `S3_*`
- [ ] Rotar `DATABASE_URL` (usuario/clave)
- [ ] Rotar `INTERNAL_CRON_SECRET`
- [ ] Verificar `DEV_AUTH_BYPASS=false` en producción
- [ ] MFA activo en Stripe, DNS/CDN, Easypanel, correo, GitHub
- [ ] SSH con llaves (sin password)
- [ ] SSH restringido por IP/VPN

### Stripe
- [ ] Alertas de Stripe (`payment_failed`, `webhook disabled`, disputas)
- [ ] Revisar endpoint webhook activo y con secreto correcto
- [ ] Probar checkout en entorno test con webhook

## Fase 1: Aplicación (ya parcialmente implementado en código)

- [x] CSP Report-Only y headers de seguridad globales
- [x] Validación de `Origin` para mutaciones API (middleware)
- [x] `Cache-Control: no-store` en rutas sensibles
- [x] Fix de open redirect en Stripe Checkout (`successPath/cancelPath`)
- [x] Rate limiting en endpoints críticos (`auth`, `contact`, `stripe`, uploads)
- [x] Sanitización HTML en perfil/blog/faqs (defensa XSS)
- [x] `password/forgot` sin señal `delivered` en producción
- [x] Mock upload deshabilitado en producción
- [x] Fallback mock-upload deshabilitado en producción si falla S3

## Fase 2: Stripe / Jobs (parcialmente implementado)

- [x] Idempotency key en `checkout-session`
- [x] Idempotency key en `change-plan`, `cancel`, `resume`, `cancel-now`
- [x] Webhook con manejo de carrera por `stripeEventId` duplicado
- [x] `internal/jobs/retry|cancel` con auth admin real
- [ ] Reconciliación automática Stripe vs DB (pendiente de implementar job/cron)
- [ ] Alerta diaria de discrepancias (pendiente)

## Fase 3: Infra (Easypanel/VPS)

### Red / Exposición
- [ ] Solo `80/443` públicos
- [ ] `5432` bloqueado públicamente
- [ ] `9000` (MinIO API) bloqueado públicamente
- [ ] `9001` (MinIO console) bloqueado o restringido
- [ ] Firewall configurado y documentado

### Reverse proxy / edge
- [ ] Cloudflare (recomendado) delante del dominio
- [ ] WAF rules activas
- [ ] Rate limit básico `/api/auth/*`, `/api/contact/*`, `/api/messages/*`
- [ ] Bot protection en formularios públicos

### HTTPS / TLS
- [ ] Redirección HTTP -> HTTPS
- [ ] Certificados válidos y auto-renovación
- [ ] HSTS validado en producción

### MinIO / S3
- [ ] CORS solo para dominio(s) de la app
- [ ] Listado de buckets deshabilitado públicamente
- [ ] Políticas separadas para `public` y `private`
- [ ] Versionado probado (restore de un objeto borrado)

## Fase 4: Observabilidad

- [ ] Uptime checks (`/`, `/api/auth/session`)
- [ ] Alertas de `5xx`, `429`, disco, backups, SMTP, S3, Stripe webhooks
- [ ] Dashboard mínimo (auth failures, checkout->webhook, errores por endpoint)
- [ ] Runbook de incidente y restore documentado
- [ ] Simulacro trimestral de restore

## Pruebas rápidas de aceptación
- [ ] `successPath=https://evil.com` devuelve `400`
- [ ] `POST` con `Origin` externo a endpoint autenticado devuelve `403`
- [ ] `mock-upload` devuelve `404` en producción
- [ ] Payload XSS (`<script>`) no ejecuta en coach/blog/faqs
- [ ] Repetir acción Stripe no duplica efectos

