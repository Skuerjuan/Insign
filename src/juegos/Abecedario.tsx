"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getVideoPath } from "@/src/diccionario/diccionario";
import fondo from "./fondoP.png";

const LETRAS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I",
  "J", "K", "L", "M", "N", "Ñ", "O", "P", "Q",
  "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
];

const COLORES_LETRAS: Record<string, string> = {
  A: "#126cff", B: "#e8b900", C: "#e91e63", D: "#126cff", E: "#4ac200", F: "#e8b900", G: "#db0000", H: "#126cff", I: "#4ac200",
  J: "#db0000", K: "#4ac200", L: "#e8b900", M: "#e91e63", N: "#126cff", Ñ: "#db0000", O: "#4ac200", P: "#e8b900", Q: "#126cff",
  R: "#e8b900", S: "#126cff", T: "#e91e63", U: "#db0000", V: "#e8b900", W: "#e91e63", X: "#126cff", Y: "#4ac200", Z: "#e8b900",
};

interface AbecedarioViewProps {
  userName?: string;
}

export default function AbecedarioView({ userName }: AbecedarioViewProps) {
  const [selectedLetraIndex, setSelectedLetraIndex] = useState<number | null>(null);

  const letraSeleccionada = selectedLetraIndex !== null ? LETRAS[selectedLetraIndex] : null;

  const handleSiguienteLetra = () => {
    if (selectedLetraIndex !== null) {
      setSelectedLetraIndex((prev) => (prev! + 1) % LETRAS.length);
    }
  };

  const primaryVideoSrc = letraSeleccionada
    ? getVideoPath("abecedario", letraSeleccionada) || `/señas/abecedario/${letraSeleccionada}.mp4`
    : "";

  return (
    <div 
      className="w-full h-screen p-3 md:p-5 flex flex-col items-center justify-between overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${fondo.src})`, backgroundColor: "#87CEEB" }}
    >
      
      {/* HUD / Barra Superior */}
      <div className="w-full max-w-7xl flex items-center justify-between relative my-1">
        <Link
          href="/menu"
          className="bg-[#1e78ff] text-white px-5 py-2 md:px-6 md:py-2.5 rounded-full font-black text-base md:text-lg flex items-center gap-2 shadow-lg border-2 border-white hover:scale-105 active:scale-95 transition-all z-10"
        >
          ← Volver
        </Link>

        <div className="absolute left-1/2 -translate-x-1/2 bg-[#1e78ff] border-4 border-white px-8 md:px-14 py-1.5 md:py-2 rounded-2xl shadow-xl">
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-wide text-center drop-shadow-md">
            Abecedario
          </h1>
        </div>
      </div>

      {/* Banner de la Mascota */}
      <div className="w-full max-w-7xl flex items-center gap-3.5 my-1 pl-2">
        <div className="relative w-18 h-18 md:w-24 md:h-24 shrink-0 drop-shadow-md">
          <Image
            src="/mono-seccion.png"
            alt="Mascota InSign"
            fill
            className="object-contain"
          />
        </div>
        <div className="bg-white/95 backdrop-blur-xs px-6 py-2.5 md:px-7 md:py-3 rounded-2xl md:rounded-3xl shadow-md border-2 md:border-4 border-[#1e78ff]/30 relative">
          <p className="text-[#05215b] font-black text-lg md:text-2xl">
            ¡Aprendamos las letras!
          </p>
          <p className="text-gray-600 font-bold text-xs md:text-base">
            Tocá una letra para ver la seña
          </p>
        </div>
      </div>

      {/* Grilla con Cuadritos Más Separados y Ligera Reducción de Tamaño */}
      <div className="w-full max-w-6xl grid grid-cols-9 gap-3.5 md:gap-5 lg:gap-6 my-auto px-2">
        {LETRAS.map((letra, index) => {
          const color = COLORES_LETRAS[letra] || "#126cff";
          return (
            <button
              key={letra}
              onClick={() => setSelectedLetraIndex(index)}
              className="bg-white aspect-[1.1/1] rounded-2xl md:rounded-3xl shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-2 md:border-4 border-gray-100 hover:border-[#1e78ff] cursor-pointer group"
            >
              <span
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black group-hover:scale-110 transition-transform"
                style={{ color }}
              >
                {letra}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tarjeta Inferior Centrada y Compacta */}
      <div className="bg-[#fffde7]/95 backdrop-blur-xs rounded-2xl border-3 md:border-4 border-[#ffe082] px-8 py-2 md:py-2.5 shadow-lg flex flex-col items-center justify-center text-center max-w-lg w-auto my-1">
        <h3 className="text-base md:text-lg font-black text-[#05215b]">
          ¡Aprendé Jugando!
        </h3>
        <p className="text-xs md:text-sm font-bold text-gray-700">
          Practica el abecedario para aprender mejor
        </p>
      </div>

      {/* Modal Reproductor */}
      {letraSeleccionada && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-8 border-[#1e78ff] shadow-2xl p-5 md:p-6 relative max-w-xl w-full flex flex-col items-center animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSelectedLetraIndex(null)}
              className="absolute top-4 right-4 bg-[#ffd32a] hover:bg-[#fbc02d] text-[#05215b] font-black w-10 h-10 rounded-full border-2 border-white shadow-md flex items-center justify-center text-xl hover:scale-110 active:scale-90 transition-transform cursor-pointer z-10"
              aria-label="Cerrar modal"
            >
              ✕
            </button>

            <h2 className="text-xl md:text-2xl font-black text-[#05215b] mb-3 mt-1">
              Seña de la letra <span className="text-[#1e78ff] text-3xl">{letraSeleccionada}</span>
            </h2>

            <div className="w-full max-w-sm aspect-4/3 bg-slate-900 rounded-2xl overflow-hidden border-4 border-blue-100 shadow-inner flex items-center justify-center my-2">
              <video
                key={letraSeleccionada}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain"
              >
                <source src={primaryVideoSrc} type="video/mp4" />
                <source src={`/señas/abecedario/${letraSeleccionada}.mp4`} type="video/mp4" />
                <source src={`/señas/abecedario/${letraSeleccionada.toLowerCase()}.mp4`} type="video/mp4" />
                Tu navegador no soporta la reproducción de video.
              </video>
            </div>

            <div className="w-full flex justify-end mt-4">
              <button
                onClick={handleSiguienteLetra}
                className="bg-[#ffd32a] hover:bg-[#fbc02d] text-[#05215b] font-black px-6 py-2.5 rounded-full text-base shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                Siguiente letra ➔
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}