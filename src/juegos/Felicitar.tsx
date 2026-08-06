"use client";

import React from "react";

interface ModalVictoriaProps {
  puntosGanados?: number;
  onVolverInicio: () => void;
  onSiguienteNivel: () => void;
  // Prop reservada para las estrellas futuras
  estrellas?: number; 
}

export default function ModalVictoria({
  puntosGanados = 30,
  onVolverInicio,
  onSiguienteNivel,
}: ModalVictoriaProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div 
        className="relative w-full max-w-lg rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center overflow-hidden border-4 border-yellow-400 bg-cover bg-center"
        style={{ backgroundImage: "url('/fondoP.png')" }} // Usamos el fondo de la selva
      >
        {/* Título Principal */}
        <h1 
          className="text-4xl sm:text-5xl font-black text-amber-400 tracking-wide drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]"
          style={{ WebkitTextStroke: "2px #b45309" }}
        >
          ¡Felicidades!
        </h1>
        
        <p className="text-xl sm:text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1 mb-2">
          Completaste el nivel
        </p>

        {/* Personaje Centrado */}
        <div className="my-2 relative w-40 h-40 flex items-center justify-center">
          <img 
            src="/mono.png" // Reemplaza por la ruta de tu imagen de mono
            alt="Mono victorioso" 
            className="w-full h-full object-contain drop-shadow-lg"
          />
        </div>

        {/* Espacio reservado para las estrellas futuras */}
        <div className="h-12 w-full flex items-center justify-center my-1">
          {/* Aquí irán las estrellas */}
        </div>

        {/* Tarjeta de Puntos Ganados */}
        <div className="bg-white/95 rounded-2xl p-3 w-48 shadow-lg border-2 border-yellow-300 flex flex-col items-center mb-6">
          <span className="text-blue-900 font-extrabold text-lg">Ganaste</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-yellow-400 text-3xl drop-shadow">★</span>
            <span className="text-blue-900 font-black text-2xl">+{puntosGanados}</span>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex w-full items-center justify-between gap-4">
          {/* Botón Volver a Inicio (Menú) */}
          <button
            onClick={onVolverInicio}
            className="flex-1 bg-amber-400 hover:bg-amber-500 text-blue-950 font-black py-3 px-4 rounded-2xl border-b-4 border-amber-600 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2 shadow-md text-sm sm:text-base"
          >
            <span className="text-xl">↺</span>
            Volver a inicio
          </button>

          {/* Botón Siguiente Nivel */}
          <button
            onClick={onSiguienteNivel}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-3 px-4 rounded-2xl border-b-4 border-blue-900 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2 shadow-md text-sm sm:text-base"
          >
            Siguiente nivel
            <span className="text-xl">➔</span>
          </button>
        </div>
      </div>
    </div>
  );
}