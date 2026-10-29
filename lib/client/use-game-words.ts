"use client";

import { useMemo } from "react";

// Las Server Actions pueden reenviar el mismo mazo en un array nuevo.
// Conservamos su identidad mientras no cambien las palabras de la partida.
export function useGameWords(words?: string[]) {
  const key = JSON.stringify(words ?? null);
  return useMemo(() => (JSON.parse(key) as string[] | null) ?? undefined, [key]);
}
