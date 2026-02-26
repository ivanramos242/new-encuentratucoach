# Runbook: Backups y Restauración (Postgres + MinIO)

## Objetivo
- RPO: `<= 24h` (ideal `<= 1h`)
- RTO: `<= 4h`

## PostgreSQL

### Backup lógico (ejemplo)
```bash
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-privileges > backup-$(date +%F-%H%M).dump
```

### Restore (entorno de prueba)
```bash
createdb etc_restore_test
pg_restore --clean --if-exists --no-owner --no-privileges -d etc_restore_test backup-YYYY-MM-DD-HHMM.dump
```

### Validaciones post-restore
- Conteo de usuarios
- Conteo de coaches
- Suscripciones recientes
- Eventos Stripe (`billingEventLog`)
- Mensajes (`conversation*`)

## MinIO

### Requisitos
- Versionado activo en `etc-public` y `etc-private`
- Sync externo diario (bucket remoto o almacenamiento secundario)

### Restore de objeto (prueba)
- Recuperar una versión previa de un objeto borrado accidentalmente
- Verificar descarga desde la app y desde cliente S3

## Cadencia recomendada
- Diario: backup automático DB + sync MinIO
- Semanal: prueba de restore en staging
- Trimestral: simulacro completo (DB + archivos + verificación funcional)

## Evidencia a guardar
- Fecha/hora backup
- Tamaño del backup
- Duración restore
- Resultado validaciones
- Incidencias detectadas y corrección

