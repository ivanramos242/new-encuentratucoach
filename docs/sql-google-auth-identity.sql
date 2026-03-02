-- Google OAuth identity table (PostgreSQL)
-- Run this script in production before deploying code that uses prisma.authIdentity.
-- Important: do not wrap this script in a single transaction because of CONCURRENTLY.

CREATE TABLE IF NOT EXISTS "AuthIdentity" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "providerEmail" TEXT,
  "providerData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'AuthIdentity_pkey'
  ) THEN
    ALTER TABLE "AuthIdentity"
      ADD CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY ("id");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'AuthIdentity_userId_fkey'
  ) THEN
    ALTER TABLE "AuthIdentity"
      ADD CONSTRAINT "AuthIdentity_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "AuthIdentity_provider_providerAccountId_key"
  ON "AuthIdentity"("provider", "providerAccountId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "AuthIdentity_userId_idx"
  ON "AuthIdentity"("userId");

