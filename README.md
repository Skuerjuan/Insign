# InSign
### Por Felipe Maierowicz, Facundo Pirolo, Tobías German y Thiago Yusefoff
InSign es una plataforma de aprendizaje no tradicional de Lengua de Señas Argentina (LSA) para infancias.
Ofrecemos una alternativa lúdica al entorno académico, dejando que los chicos aprendan jugando.

### Examen final y avance de niveles

El examen final se habilita debajo de los juegos después de completar Memoria,
Elección, Completar y Múltiple elección en el modo normal. El examen incluye solamente
Elección, Completar y Múltiple elección, y evalúa todas las señas del nivel como
objetivos, repitiendo esos tres juegos cuando hace falta. Un error
invalida el intento completo. Solamente aprobarlo habilita el siguiente nivel;
ver señas o jugar en entrenamiento no permite avanzar.

Antes de ejecutar esta versión contra una base existente, aplicar la migración:

```sh
npx prisma migrate deploy
```

La migración agrega los exámenes aprobados y sus intentos. Los usuarios conservan
sus señas vistas y juegos completados; deben aprobar los exámenes para avanzar.

Verificaciones locales:

```sh
node scripts/verify-learning.cjs
node scripts/verify-game-lifecycle.cjs
node scripts/verify-game-layout.cjs
node scripts/verify-signs.mjs
npx tsc --noEmit
```

Los recursos gráficos de la aplicación están en WebP, con transparencia y
compresión sin pérdida. `scripts/convert-images.mjs` convierte recursos existentes
y actualiza sus referencias; `scripts/build-waki-icons.mjs` regenera los íconos WebP.
