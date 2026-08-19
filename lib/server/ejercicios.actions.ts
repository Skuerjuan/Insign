"use server"

import { prisma } from "@/db"
import { getSession } from "./profile.actions";

export type RespuestaEjercicio = {
    opcionId: number;
    seleccionada: boolean;
};


export default async function getEjercicio(
    tema: string,
    dificultad: number,
    tipo: string,
) {
    const user = await getSession();

    const ejercicios = await prisma.ejercicios.findMany({
        where: {
            tema,
            dificultad,
            tipo,
            completado: {
                none: {
                    usuario_id: user.id,
                },
            },
        },
        include: {
            opciones: {
                include: {
                    palabras: {
                        select: {
                            palabra: true,
                            animacion: true,
                        },
                    },
                },
            },
        },
    });

    if (ejercicios.length === 0) {
        return null;
    }

    const ejercicio = ejercicios[Math.floor(Math.random() * ejercicios.length)];

    return {
        id: ejercicio.id,
        tema: ejercicio.tema,
        dificultad: ejercicio.dificultad,
        tipo: ejercicio.tipo,
        opciones: ejercicio.opciones.map((opcion) => ({
            id: opcion.id,
            palabraId: opcion.palabra_id,
            palabra: opcion.palabras.palabra,
            animacion: opcion.palabras.animacion,
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
