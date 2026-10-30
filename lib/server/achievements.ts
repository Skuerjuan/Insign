import type { Prisma } from "@/prisma/generated/client";

// Stable IDs shared by the achievement rules and the database catalog.
export const ACHIEVEMENTS = [
    { id: "primeras-senas", name: "Primeras señas", description: "Completar el primer juego." },
    { id: "manos-a-la-obra", name: "Manos a la obra", description: "Completar tu primer entrenamiento." },
    { id: "pequeno-explorador", name: "Pequeño Explorador", description: "Completar tu primer tema." },
    { id: "aprendiz", name: "Aprendiz", description: "Aprender 10 señas." },
    { id: "memoria-de-elefante", name: "Memoria de Elefante", description: "Completar un juego de memoria sin errores." },
    { id: "gran-aprendiz", name: "Gran Aprendiz", description: "Aprender 25 señas." },
    { id: "maestro-de-senas", name: "Maestro de Señas", description: "Aprender 50 señas." },
    { id: "racha-imparable", name: "Racha Imparable", description: "Completar 3 actividades seguidas." },
    { id: "todo-correcto", name: "Todo Correcto", description: "Completar un tema sin equivocarte." },
    { id: "estrella-del-dia", name: "Estrella del Día", description: "Conseguir 3 estrellas en una actividad." },
    { id: "explorador-de-temas", name: "Explorador de Temas", description: "Completar 5 temas diferentes." },
    { id: "lo-logre", name: "¡Lo logré!", description: "Aprobar tu primer examen." },
    { id: "campeon-de-insign", name: "Campeón de InSign", description: "Completar todos los temas disponibles." },
    { id: "on-fire", name: "On Fire", description: "Completar una semana jugando a InSign." },
];

export async function ensureAchievementCatalog(db: Prisma.TransactionClient) {
    // Each deployment may use a different database. Seed before inserting any FK,
    // including inside completeGame's transaction; concurrent requests are safe.
    await db.logros.createMany({ data: ACHIEVEMENTS, skipDuplicates: true });
}
