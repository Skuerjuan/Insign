ALTER TABLE "public"."profiles" ADD COLUMN "examenes_aprobados" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];
CREATE TABLE "public"."examenes_intentos" (
  "id" UUID NOT NULL,
  "usuario_id" UUID NOT NULL,
  "nivel" SMALLINT NOT NULL,
  "plan" JSONB NOT NULL,
  "ronda" INTEGER NOT NULL DEFAULT 0,
  "estado" TEXT NOT NULL DEFAULT 'activo',
  "creado_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "examenes_intentos_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "examenes_intentos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE INDEX "examenes_intentos_usuario_id_nivel_idx" ON "public"."examenes_intentos"("usuario_id", "nivel");
