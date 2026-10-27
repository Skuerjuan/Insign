import catalogoVideos from "./videos.json";

export interface CategoriaInfo {
  id: string;
  titulo: string;
  palabras: string[];
}

// El catálogo conserva los nueve niveles; el abecedario se administra por separado.
export const CATEGORIAS: CategoriaInfo[] = catalogoVideos.map(({ id, titulo, videos }) => ({
  id,
  titulo,
  palabras: Object.keys(videos),
}));

export const DICCIONARIO_CATEGORIAS: Record<string, string[]> = Object.fromEntries(
  CATEGORIAS.map(({ id, palabras }) => [id, palabras])
);

const ARCHIVOS_VIDEO: Record<string, Partial<Record<string, string>>> = Object.fromEntries(
  catalogoVideos.map(({ id, videos }) => [id, videos])
);

const CARPETAS_VIDEO: Record<string, string> = Object.fromEntries(
  catalogoVideos.map(({ id, carpeta }) => [id, carpeta])
);

export function getVideoPath(
  levelIdentifier: number | string,
  palabra: string
): string | undefined {
  const categoryId =
    typeof levelIdentifier === "number"
      ? CATEGORIAS[levelIdentifier - 1]?.id
      : levelIdentifier;
  const folder = CARPETAS_VIDEO[categoryId];
  const filename = ARCHIVOS_VIDEO[categoryId]?.[palabra];

  if (!folder || !filename) return undefined;

  return `/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`;
}

// Fallback corregido a 'presentacion-1' para evitar referencias a 'abecedario'
export function getPalabrasPorCategoria(idCategoria: string): string[] {
  const palabras =
    DICCIONARIO_CATEGORIAS[idCategoria] ||
    DICCIONARIO_CATEGORIAS["presentacion-1"] ||
    [];
  const categoryId = DICCIONARIO_CATEGORIAS[idCategoria]
    ? idCategoria
    : "presentacion-1";

  return palabras.filter((palabra) => Boolean(ARCHIVOS_VIDEO[categoryId]?.[palabra]));
}

// Configuración de metadatos estéticos para la vista de niveles
const METADATOS_NIVELES: Record<
  string,
  { description: string; color: string; colorClass: string }
> = {
  "presentacion-1": {
    description: "Aprende a saludar, presentarte y conocer expresiones básicas.",
    color: "#126cff",
    colorClass: "presentationOne",
  },
  "presentacion-2": {
    description: "Preséntate, saluda a otros y aprende preguntas básicas.",
    color: "#4ac200",
    colorClass: "presentationTwo",
  },
  "familia-y-amigos": {
    description: "Conoce a los miembros de la familia y a otras personas.",
    color: "#db0000",
    colorClass: "familyAndFriends",
  },
  numeros: {
    description: "Aprende los números en LSA de forma fácil y divertida.",
    color: "#c900d4",
    colorClass: "numbers",
  },
  "colegio-1": {
    description: "Aprende las señas básicas sobre el colegio y sus útiles.",
    color: "#e8b900",
    colorClass: "school",
  },
  clima: {
    description: "Aprende sobre los distintos tipos de clima.",
    color: "#00aec2",
    colorClass: "weather",
  },
  "partes-de-la-casa": {
    description: "Conoce las partes de la casa y sus objetos principales.",
    color: "#ff8800",
    colorClass: "houseParts",
  },
  "preguntas-afuera": {
    description: "Aprende preguntas y respuestas sobre orientación en LSA.",
    color: "#ff0099",
    colorClass: "questions",
  },
  comprar: {
    description: "Aprende a pedir, elegir y comprar diferentes productos.",
    color: "#002767",
    colorClass: "shopping",
  },
};

// Generación dinámica de LEVELS a partir del array CATEGORIAS
export const LEVELS = CATEGORIAS.map((cat, index) => {
  const meta = METADATOS_NIVELES[cat.id] || {
    description: "Aprende las señas principales de esta categoría.",
    color: "#126cff",
    colorClass: "defaultLevel",
  };

  return {
    id: index + 1,
    title: cat.titulo,
    categoryId: cat.id,
    description: meta.description,
    color: meta.color,
    colorClass: meta.colorClass,
    palabras: cat.palabras,
  };
});

// Acepta tanto números (ej: 1, 2) como cadenas con el id de categoría (ej: "presentacion-1")
export function getLevel(levelIdentifier: number | string) {
  if (typeof levelIdentifier === "number") {
    return LEVELS.find((level) => level.id === levelIdentifier);
  }
  return LEVELS.find((level) => level.categoryId === levelIdentifier);
}
export function getLevelWords(levelIdentifier: number | string): string[] {
  const level = getLevel(levelIdentifier);
  if (!level) return [];

  return level.palabras.filter((palabra) =>
    Boolean(ARCHIVOS_VIDEO[level.categoryId]?.[palabra])
  );
}
