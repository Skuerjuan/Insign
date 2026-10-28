// Las claves originales se conservan para los videos y el progreso guardado.
// Estas funciones convierten las abreviaturas del catálogo en texto para leer.
export function getVariantesSena(palabra: string): string[] {
  return palabra.split(" - ").flatMap((termino) => {
    const plural = termino.match(/^(.+)-as$/u);
    if (plural) {
      const masculino = plural[1];
      return [masculino, masculino.replace(/os$/u, "as")];
    }
    const singular = termino.match(/^(.+)-a$/u);
    if (singular) {
      const masculino = singular[1];
      return [masculino, masculino.endsWith("o") ? masculino.slice(0, -1) + "a" : masculino + "a"];
    }
    return [termino.trim()];
  });
}

const PREGUNTAS = new Set(["Cómo estás", "Cómo es", "Dónde está", "Cuánto cuesta", "De qué tamaño es"]);

export function getTextoSena(palabra: string): string {
  if (PREGUNTAS.has(palabra)) return `¿${palabra}?`;
  return getVariantesSena(palabra).join(" / ");
}

export function getPalabraCompletar(palabra: string): string {
  // Se deletrea un término válido, nunca guiones de género ni dos sinónimos juntos.
  return getVariantesSena(palabra)[0];
}

export function getGrupoSena(palabra: string): string {
  // Evita presentar sinónimos como si uno fuera una respuesta incorrecta.
  if (palabra === "Boda" || palabra === "Casamiento") return "casamiento";
  return palabra;
}

export function getSeniasSinAmbiguedad(palabras: string[]): string[] {
  const grupos = new Set<string>();
  return palabras.filter((palabra) => {
    const grupo = getGrupoSena(palabra);
    if (grupos.has(grupo)) return false;
    grupos.add(grupo);
    return true;
  });
}
