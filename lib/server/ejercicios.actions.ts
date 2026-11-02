"use server"

import { prisma } from "@/db"
import { getSession } from "./profile.actions";

export type RespuestaEjercicio = {
    opcionId: number;
    seleccionada: boolean;
};


const CANTIDAD_POR_TIPO: Record<string, number> = {
    eleccion: 4,
    adivinar: 6,
    completar: 1,
    memoria: 8,
};

function mezclar<T>(items: T[]): T[] {
    const resultado = [...items];
    for (let i = resultado.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [resultado[i], resultado[j]] = [resultado[j], resultado[i]];
    }
    return resultado;
}

export default async function getEjercicio(tipo: string, nivel: number) {
    if (!Object.hasOwn(CANTIDAD_POR_TIPO, tipo) || !Number.isInteger(nivel) || nivel < 1) return null;
    const cantidad = CANTIDAD_POR_TIPO[tipo];

    await getSession();

    const palabras = await prisma.palabras.findMany({
        where: { nivel },
        select: { id: true, palabra: true, video: true },
    });

    if (palabras.length < cantidad) return null;

    return {
        tipo,
        nivel,
        senas: mezclar(palabras).slice(0, cantidad).map((palabra) => ({
            id: palabra.id,
            palabra: palabra.palabra,
            video: palabra.video,
        })),
    };
}

export async function correctEjercicio(respuestas: RespuestaEjercicio[]) {
    await getSession();

    if (respuestas.length === 0) {
        return { correcto: false };
    }

    const respuestasPorOpcion = new Map(
        respuestas.map((respuesta) => [respuesta.opcionId, respuesta.seleccionada]),
    );

    if (respuestasPorOpcion.size !== respuestas.length) {
        return { correcto: false };
    }

    const opciones = await prisma.opciones.findMany({
        where: {
            id: {
                in: [...respuestasPorOpcion.keys()],
            },
        },
        select: {
            id: true,
            ejercicio_id: true,
            correcto: true,
        },
    });

    if (opciones.length !== respuestas.length) {
        return { correcto: false };
    }

    const ejercicioId = opciones[0].ejercicio_id;
    if (opciones.some((opcion) => opcion.ejercicio_id !== ejercicioId)) {
        return { correcto: false };
    }

    const cantidadOpciones = await prisma.opciones.count({
        where: { ejercicio_id: ejercicioId },
    });

    const correcto = opciones.length === cantidadOpciones
        && opciones.every(
            (opcion) => opcion.correcto === respuestasPorOpcion.get(opcion.id),
        );

    return { correcto };
}
