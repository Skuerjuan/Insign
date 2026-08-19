"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface PantallaSinVidasProps {
  rutaEntrenamiento?: string;
  rutaInicio?: string;
  onIrEntrenamiento?: () => void;
  onVolverInicio?: () => void;
}

export default function PantallaSinVidas({
  rutaEntrenamiento = "/entrenamiento",
  rutaInicio = "/menu",
  onIrEntrenamiento,
  onVolverInicio,
}: PantallaSinVidasProps) {
  const router = useRouter();

  const handleEntrenamiento = () => {
    if (onIrEntrenamiento) {
      onIrEntrenamiento();
    } else {
      router.push(rutaEntrenamiento);
    }
  };

  const handleInicio = () => {
    if (onVolverInicio) {
      onVolverInicio();
    } else {
      router.push(rutaInicio);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Contenedor Principal con Fondo de Selva */}
      <div
        className="relative w-full max-w-sm rounded-3xl p-5 text-center shadow-2xl flex flex-col items-center bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: "url('/fondoP.png')" }}
      >
        {/* Títulos con Borde Blanco Estilo Juego */}
        <div className="flex flex-col items-center mt-2 z-10">
          <h1
            className="text-6xl font-black text-[#FF2B2B] tracking-wide"
            style={{
              WebkitTextStroke: "2.5px white",
              paintOrder: "stroke fill",
              filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.3))",
            }}
          >
            ¡Ups!
          </h1>
          <h2
            className="text-2xl font-black text-[#0B2545] mt-1 tracking-tight"
            style={{
              WebkitTextStroke: "1.5px white",
              paintOrder: "stroke fill",
              filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.2))",
            }}
          >
            Te quedaste sin vidas
          </h2>
        </div>

        {/* Imagen del Monito Triste Superpuesto */}
        <div className="w-36 h-36 -mb-8 z-20 relative flex items-center justify-center">
          <img
            src="/mono-triste.png"
            alt="Sin vidas"
            className="w-full h-full object-contain filter drop-shadow-md"
          />
        </div>

        {/* Tarjeta Interna Beige */}
        <div className="w-full bg-[#FFF9E6] rounded-3xl pt-9 pb-4 px-4 shadow-xl flex flex-col items-center z-10">
          <h3 className="text-2xl font-black text-[#E53935] mb-1">
            ¡No pasa nada!
          </h3>
          <p className="text-xs font-bold text-[#0B2545] leading-snug mb-3 max-w-[240px]">
            Podes seguir practicando en Entrenamiento para mejorar y lograr pasar el nivel.
          </p>

          <div className="w-10 h-0.5 bg-[#0B2545]/20 rounded-full mb-3" />

          {/* Botón Ir a entrenamiento */}
          <button
            onClick={handleEntrenamiento}
            className="w-full py-3 px-4 bg-[#FFC700] hover:bg-[#F0BA00] active:translate-y-0.5 text-[#0B2545] font-black text-base rounded-2xl shadow-md border-b-4 border-[#D99B00] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg
              className="w-6 h-6 fill-current text-[#1E78FF]"
              viewBox="0 0 24 24"
            >
              <path d="M6 5a2 2 0 0 1 2 2v10a2 2 0 0 1-4 0V7a2 2 0 0 1 2-2zm14 0a2 2 0 0 1 2 2v10a2 2 0 0 1-4 0V7a2 2 0 0 1 2-2zM9 11h6v2H9v-2zM2 9a1 1 0 0 1 1-1h1v8H3a1 1 0 0 1-1-1V9zm18 0h1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-1V9z" />
            </svg>
            Ir a entrenamiento
          </button>
        </div>

        {/* Botón Volver a inicio */}
        <button
          onClick={handleInicio}
          className="w-full mt-3 py-3.5 px-4 bg-[#1E78FF] hover:bg-[#1565C0] active:translate-y-0.5 text-white font-black text-base rounded-2xl shadow-md border-b-4 border-[#0D47A1] transition-all flex items-center justify-center gap-2 cursor-pointer z-10"
        >
          <svg
            className="w-6 h-6 fill-none stroke-current stroke-[3] text-white"
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Volver a inicio
        </button>
      </div>
    </div>
  );
}