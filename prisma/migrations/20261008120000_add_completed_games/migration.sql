CREATE TABLE "public"."juegos_completados" (
    "id" SERIAL NOT NULL,
    "usuario_id" UUID NOT NULL,
    "nivel" SMALLINT NOT NULL,
    "juego" TEXT NOT NULL,
    "completado_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "juegos_completados_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "juegos_completados_usuario_id_nivel_idx"
ON "public"."juegos_completados"("usuario_id", "nivel");

CREATE UNIQUE INDEX "juegos_completados_usuario_id_nivel_juego_key"
ON "public"."juegos_completados"("usuario_id", "nivel", "juego");

ALTER TABLE "public"."juegos_completados"
ADD CONSTRAINT "juegos_completados_usuario_id_fkey"
FOREIGN KEY ("usuario_id") REFERENCES "neon_auth"."user"("id")
ON DELETE CASCADE ON UPDATE NO ACTION;
