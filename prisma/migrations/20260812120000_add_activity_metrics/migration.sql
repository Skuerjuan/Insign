ALTER TABLE "public"."profiles"
ADD COLUMN IF NOT EXISTS "juegos_jugados" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "dias_activos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "ultimo_dia_activo" INTEGER,
ADD COLUMN IF NOT EXISTS "tiempo_total_segundos" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "public"."sesiones_contabilizadas" (
    "session_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "inicio" TIMESTAMPTZ(6) NOT NULL,
    "fin" TIMESTAMPTZ(6) NOT NULL,
    "segundos" INTEGER NOT NULL,

    CONSTRAINT "sesiones_contabilizadas_pkey" PRIMARY KEY ("session_id"),
    CONSTRAINT "sesion_usuario" FOREIGN KEY ("usuario_id")
        REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "sesiones_contabilizadas_usuario_id_idx"
ON "public"."sesiones_contabilizadas"("usuario_id");
