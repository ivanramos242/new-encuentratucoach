# Migración WordPress -> nueva plataforma (coaches + usuarios)

## Alcance V1
- Migrar `CPT coaches`
- Migrar `usuarios`
- No migrar blog ni resto de contenido

## Pipeline propuesto
1. `extract`: leer SQL + postmeta + users/usermeta
2. `transform`: normalizar ACF (`Ubicacion`, `idiomas`, `Tipo_de_Sesion`, precios, links)
3. `load`: insertar en Postgres (Prisma) y crear `LegacyImportMap`
4. `verify`: recuentos, slugs, relaciones coach-usuario y datos críticos

## Seguridad
- No migrar hash WP para login directo
- Usuarios migrados con `mustResetPassword = true`
