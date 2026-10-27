ALTER TABLE "public"."profiles"
ADD COLUMN IF NOT EXISTS "senas_aprendidas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
