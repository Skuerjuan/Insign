# Librería interna (`lib/`)

Este directorio concentra los clientes de autenticación y base de datos, las acciones de servidor y los helpers que comparten las pantallas y juegos.

## Estructura

| Ruta | Entorno | Responsabilidad |
| --- | --- | --- |
| `auth/client.ts` | Cliente | Instancia de Neon Auth para componentes del navegador. |
| `auth/server.ts` | Servidor | Instancia de Neon Auth, cookies y sesión del servidor. |
| `client/` | Cliente | Operaciones de perfil, OAuth y cierre de sesión. |
| `prisma.ts` | Servidor | Cliente Prisma reutilizable con adaptador PostgreSQL. |
| `server/ejercicios.actions.ts` | Servidor | Obtención y corrección de ejercicios. |
| `server/profile.actions.ts` | Servidor | Sesión, perfil, puntaje, XP y tiempo de uso. |
| `server/streak.ts` | Compartido | Cálculo y codificación de actividad semanal. |

## `auth/client.ts`

### `authClient`

Instancia creada con `createAuthClient()` de Neon Auth. Usarla únicamente desde módulos cliente (`"use client"`).

Se usa, entre otros casos, para actualizar el usuario, iniciar sesión con Google y cerrar sesión.

## `auth/server.ts`

### `auth`

Instancia de `createNeonAuth()` para el servidor. Lee `NEON_AUTH_BASE_URL` y `NEON_AUTH_COOKIE_SECRET`. Configura las cookies con `sameSite: "lax"` para que el desafío de OAuth pueda volver desde el proveedor externo.

## `prisma.ts`

### `prisma`

Cliente singleton de Prisma conectado con `PrismaPg` y `DATABASE_URL`. En desarrollo se guarda en `globalThis` para no crear una conexión nueva tras cada recarga de Next.js.

## `client/`

Estas funciones deben ejecutarse en componentes cliente.

### `updateNombre(nombre)`

Archivo: `client/updateNombre.ts`.

Actualiza el campo `name` del usuario autenticado mediante `authClient.updateUser`. Recibe el nuevo nombre como `string`. Si Neon Auth devuelve un error, lo registra en consola.

### `updateFoto(foto)`

Archivo: `client/updateFoto.ts`.

Actualiza el campo `image` del usuario autenticado. Recibe una URL o ruta de imagen como `string`. Registra en consola cualquier error devuelto por Neon Auth.

### `signInWithGoogle()`

Archivo: `client/signInWithGoogle.ts`.

Inicia OAuth con Google. Al completar correctamente redirige a `/menu`; si falla, vuelve a `/auth/sign-in`. Calcula ambas URLs a partir de `window.location.origin` y registra los errores en consola.

### `cerrarSesion(router)`

Archivo: `client/cerrarSesion.ts`.

Registra primero el fin de la sesión en `POST /api/session/end`. Aunque ese registro falle, cierra la sesión de Neon Auth, navega a `/auth/sign-in` y refresca el router.

`router` debe tener las funciones `push(href)` y `refresh()`, como el valor devuelto por `useRouter()` de `next/navigation`.

## `server/profile.actions.ts`

Archivo con `"use server"`: sus funciones son Server Actions y consultan la sesión o la base de datos en el servidor.

### Tipos

| Tipo | Valores | Uso |
| --- | --- | --- |
| `GameName` | `"eleccion"`, `"memoria"` | Juego que entrega el puntaje. |
| `GameOrigin` | `"menu"`, `"training"` | Origen de la partida; entrenamiento registra actividad de entrenamiento. |

### `getSession()`

Obtiene el usuario autenticado mediante `auth.getSession()`. Si no existe, redirige a `/auth/sign-in`. Devuelve el objeto `user` de Neon Auth.

### `isVerified()`

Obtiene la sesión con `getSession()` y devuelve el booleano `user.emailVerified`.

### `getProfile(userId)`

Busca el perfil de `userId` en `profiles`. Si todavía no existe, lo crea con estadísticas iniciales en cero. Devuelve el perfil existente o recién creado.

### `completeGame(game, mistakes = 0, origin = "menu")`

Registra una partida del usuario actual dentro de una transacción:

- valida que `game` sea `"eleccion"` o `"memoria"`;
- normaliza `mistakes` a un entero no negativo;
- crea el perfil si es necesario;
- suma puntos, juegos jugados y, si corresponde, días activos;
- actualiza la actividad semanal codificada y la racha;
- bloquea la fila de perfil durante la actualización para evitar conflictos concurrentes.

Puntos actuales: `memoria` siempre suma 15; `eleccion` suma 15, 10, 5 o 0 según haya 0, 1, 2 o más errores. Devuelve `pointsAwarded`, `totalPoints`, `streak`, `gamesPlayed` y `activeDays`.

### `recordSessionEnd()`

Calcula los segundos desde `session.createdAt` hasta el momento actual y los agrega a `profiles.tiempo_total_segundos`. Crea un registro en `sesiones_contabilizadas` y evita contar dos veces la misma sesión usando `session_id`. Devuelve el tiempo total acumulado en segundos.

### `addPoints(newPoints, userId)`

Normaliza `newPoints` a entero, garantiza que exista el perfil y aumenta `profiles.puntos` de `userId`. Devuelve el perfil actualizado.

### `addXp(newXp, userId)`

Normaliza `newXp` a entero no negativo, garantiza el perfil y agrega experiencia. Cada 100 puntos de experiencia incrementa `nivel`; el resto queda en `experiencia`. Devuelve el perfil actualizado.

### Helpers privados

- `getFullSession()`: exige que existan usuario y sesión; se usa para contabilizar la duración.
- `calculatePoints(game, mistakes)`: aplica la tabla de puntajes usada por `completeGame`.

## `server/ejercicios.actions.ts`

Archivo con `"use server"` para la selección y corrección de ejercicios.

### `RespuestaEjercicio`

Describe una respuesta enviada por el cliente:

```ts
type RespuestaEjercicio = {
  opcionId: number;
  seleccionada: boolean;
};
```

`seleccionada` indica si el usuario marcó esa opción.

### `getEjercicio(tema, dificultad, tipo)`

Obtiene el usuario de la sesión y busca ejercicios que coincidan con los tres filtros. Excluye los ejercicios que ya tengan una fila en `completado` con ese `usuario_id`. De los disponibles elige uno aleatoriamente.

Devuelve `null` si no hay ejercicios disponibles. Si encuentra uno, devuelve un objeto serializable con `id`, `tema`, `dificultad`, `tipo` y las opciones. Cada opción incluye `id`, `palabraId`, `palabra` y `animacion`; el campo `correcto` no se envía al cliente.

### `correctEjercicio(respuestas)`

Compara las respuestas del cliente con `opciones.correcto` y devuelve `{ correcto: boolean }`.

Antes de comparar, verifica que:

- haya al menos una respuesta;
- no haya IDs de opción duplicados;
- todas las opciones existan;
- todas pertenezcan al mismo ejercicio;
- se haya recibido una respuesta por cada opción del ejercicio.

Una respuesta solo es correcta si cada valor `seleccionada` coincide exactamente con el valor `correcto` de su opción.

## `server/streak.ts`

Helpers puros para representar la actividad de una semana dentro de un número entero. Los primeros siete bits representan días con juego y los siete siguientes, días de entrenamiento.

### Constantes y tipos

- `APP_TIME_ZONE`: zona horaria oficial de la aplicación, `America/Argentina/Buenos_Aires`.
- `StreakState`: objeto con el campo `count`, cantidad de días activos.
- `ActivityKind`: `"game"` o `"training"`.

### `getLocalDayNumber(date = new Date(), timeZone = APP_TIME_ZONE)`

Convierte una fecha en un número entero de día UTC respetando la zona horaria indicada. Evita que el cambio de día dependa de la zona horaria del servidor.

### `decodeStreak(value)`

Lee los primeros siete bits de `value` y devuelve cuántos días están activos: `{ count }`.

### `getWeekdayIndex(dayNumber)`

Convierte un número de día a un índice semanal de 0 a 6, con lunes como índice 0.

### `getWeekStartDay(dayNumber)`

Devuelve el número de día correspondiente al lunes de la semana de `dayNumber`.

### `getWeeklyActivity(value, lastActiveDay, today, kind = "game")`

Obtiene la máscara de actividad de la semana actual para juego o entrenamiento. Si los datos corresponden al formato antiguo de racha numérica, los convierte automáticamente. Devuelve:

```ts
{
  mask: number;
  count: number;
  days: boolean[]; // lunes a domingo
}
```

### `registerActiveDay(currentValue, lastActiveDay, today, fromTraining = false)`

Marca `today` como día con juego; además marca entrenamiento cuando `fromTraining` es `true`. Devuelve la nueva codificación, el número de días de juego de la semana y si cambió el valor:

```ts
{
  count: number;
  value: number;
  changed: boolean;
}
```
