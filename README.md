# EncuentraTuCoach (Rebuild Next.js)

Rebuild desde cero de `EncuentraTuCoach` con enfoque SEO para España, directorio de coaches, membresía para coaches y arquitectura fullstack preparada para escalar.

## Estado actual (foundation implementada)
- Next.js App Router + TypeScript + Tailwind v4
- Home pública SEO (réplica visual inspirada en el sitio actual)
- Directorio `/coaches` con filtros por URL (SSR sobre mock data)
- Perfiles públicos de coach `/coaches/[slug]`
- Landings SEO por categoría, ciudad y categoría+ciudad
- Blog y FAQs con metadata + JSON-LD
- Layout global (header/footer) y páginas públicas base
- Rutas privadas y admin scaffolded
- API contracts scaffolded (`/api/...`) con endpoints mínimos de contacto y analytics
- Prisma schema amplio (base de V1)
- Dockerfile + compose local + docs de Easypanel y migración WordPress

## Arranque local
1. Copia `.env.example` a `.env.local`
2. (Opcional) levanta servicios locales: `docker compose -f docker-compose.local.yml up -d`
3. Instala dependencias: `npm install`
4. Genera Prisma Client: `npm run prisma:generate`
5. Sincroniza esquema Prisma a tu DB local: `npm run db:push`
6. Arranca: `npm run dev`

## Scripts
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run prisma:generate`
- `npm run prisma:migrate:dev`
- `npm run db:push`
- `npm run db:studio`

## Próximos pasos (sprints)
- Auth real (email/password + sesiones + reset)
- CRUD de perfil coach con Prisma
- Stripe Billing (mensual/anual) + webhooks
- Reseñas + certificación + admin real
- Métricas persistidas (visitas/retención/clics)
- Migración WordPress (coaches + usuarios)
