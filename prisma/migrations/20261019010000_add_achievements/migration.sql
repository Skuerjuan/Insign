CREATE TABLE "public"."actividades" (
    "id" SERIAL NOT NULL,
    "usuario_id" UUID NOT NULL,
    "juego" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "nivel" SMALLINT,
    "errores" INTEGER NOT NULL DEFAULT 0,
    "estrellas" SMALLINT NOT NULL DEFAULT 0,
    "completado_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "actividades_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."logros_desbloqueados" (
    "id" SERIAL NOT NULL,
    "usuario_id" UUID NOT NULL,
    "logro_id" TEXT NOT NULL,
    "desbloqueado_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "logros_desbloqueados_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "actividades_usuario_id_completado_at_idx"
ON "public"."actividades"("usuario_id", "completado_at");
CREATE INDEX "actividades_usuario_id_nivel_idx"
ON "public"."actividades"("usuario_id", "nivel");
CREATE UNIQUE INDEX "logros_desbloqueados_usuario_id_logro_id_key"
ON "public"."logros_desbloqueados"("usuario_id", "logro_id");
CREATE INDEX "logros_desbloqueados_usuario_id_desbloqueado_at_idx"
ON "public"."logros_desbloqueados"("usuario_id", "desbloqueado_at");

ALTER TABLE "public"."actividades"
ADD CONSTRAINT "actividades_usuario_id_fkey"
FOREIGN KEY ("usuario_id") REFERENCES "neon_auth"."user"("id")
ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "public"."logros_desbloqueados"
ADD CONSTRAINT "logros_desbloqueados_usuario_id_fkey"
FOREIGN KEY ("usuario_id") REFERENCES "neon_auth"."user"("id")
ON DELETE CASCADE ON UPDATE NO ACTION;
