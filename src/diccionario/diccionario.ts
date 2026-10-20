export interface CategoriaInfo {
  id: string; // Nombre de la carpeta en public/señas/
  titulo: string; // Título visible en pantalla
  palabras: string[]; // Lista de nombres de archivos (coincide con los videos)
}

export const CATEGORIAS: CategoriaInfo[] = [
  {
    id: "presentacion-1",
    titulo: "Presentación 1",
    palabras: [
      "Hola",
      "Chau",
      //"Buenos días",
      //"Buenas tardes",
      //"Buenas noches",
      "Yo",
      "Mi",
      "Nombre",
      //"Me llamo...",
      //"Soy...",
      //"Tengo ... años",
      //"Vivo en...",
      //"Encantado/a",
      "Gracias",
      "Por favor",
    ],
  },
  {
    id: "presentacion-2",
    titulo: "Presentación 2",
    palabras: [
      "Él",
      "Ella",
      "Ellos / ellas",
      "Nosotros",
      "Ustedes",
      "Él es...",
      "Ella es...",
      "Amigo/a",
      "¿Cómo estás?",
      "Bien",
      "Mal",
      "¿De dónde sos?",
      "Más o menos",
      "¿Quién es?",
      "Mucho gusto",
    ],
  },
  {
    id: "familia-y-amigos",
    titulo: "Familia y amigos",
    palabras: [
      "Familia",
      "Mamá",
      "Papá",
      "Hermano",
      "Hermana",
      "Abuelo",
      "Abuela",
      "Tío",
      "Tía",
      "Primo",
      "Prima",
      "Amigo",
      "Amiga",
      "Hijo",
      "Hija",
    ],
  },
  {
    id: "numeros",
    titulo: "Números",
    palabras: [
      "Diez",
      "Veinte",
      "Treinta",
      "Cuarenta",
      "Cincuenta",
      "Sesenta",
      "Setenta",
      "Ochenta",
      "Noventa",
      "Cien",
      "Doscientos",
      "Quinientos",
      "Mil",
      "Dos mil",
      "Un millón",
    ],
  },
  {
    id: "colegio-1",
    titulo: "Colegio 1",
    palabras: [
      "Colegio",
      "Estudiar",
      "Estudiante",
      "Profesor/a",
      "Aula",
      "Recreo",
      "Patio",
      "Libro",
      "Cuaderno",
      "Lápiz",
      "Mochila",
      "Tarea",
      "Examen",
      "Aprender",
      "Preguntar",
    ],
  },
  {
    id: "clima",
    titulo: "Clima",
    palabras: [
      "Clima",
      "Lluvia",
      "Soleado",
      "Nublado",
      "Granizo",
      "Nieve",
      "Frío",
      "Calor",
      "Viento",
      "Tormenta",
      "Niebla",
      "Húmedo",
      "Seco",
      "Embarrado",
      "Temperatura",
    ],
  },
  {
    id: "partes-de-la-casa",
    titulo: "Partes de la casa",
    palabras: [
      "Casa",
      "Puerta",
      "Ventana",
      "Cocina",
      "Baño",
      "Dormitorio",
      "Sala",
      "Comedor",
      "Techo",
      "Piso",
      "Pared",
      "Escalera",
      "Garaje",
      "Jardín",
      "Balcón",
    ],
  },
  {
    id: "preguntas-afuera",
    titulo: "Preguntas afuera / orientación",
    palabras: [
      "¿Dónde está?",
      "¿Hay?",
      "No hay",
      "¿Cómo es?",
      "¿Cuánto?",
      "¿Qué?",
      "¿Quién?",
      "¿Cuándo?",
      "¿Por qué?",
      "¿Cómo?",
      "Acá",
      "Allá",
      "Cerca",
      "Lejos",
      "Ayuda",
    ],
  },
  {
    id: "comprar",
    titulo: "Comprar",
    palabras: [
      "Comprar",
      "Vender",
      "¿Cuánto cuesta?",
      "Precio",
      "Caro",
      "Barato",
      "Tamaño",
      "¿De qué tamaño es?",
      "Talle",
      "Color",
      "Grande",
      "Mediano",
      "Chico",
      "Quiero este/a",
      "Pagar",
    ],
  },
];

export const DICCIONARIO_CATEGORIAS: Record<string, string[]> = CATEGORIAS.reduce(
  (acc, cat) => {
    acc[cat.id] = cat.palabras;
    return acc;
  },
  {} as Record<string, string[]>
);

// Los archivos originales no usan el mismo nombre que las palabras visibles:
// incluyen numeración, espacios, palabras sin tilde y, en algunos casos, un
// solo video representa dos palabras. Esta tabla mantiene esa diferencia en un
// único lugar para que todos los juegos carguen exactamente el mismo recurso.
const ARCHIVOS_VIDEO: Record<string, Record<string, string>> = {
  "presentacion-1": {
    Hola: "Hola.mp4",
    Chau: "Chau.mp4",
    Yo: "06 - Yo.mp4",
    Mi: "07 - Mi - mio.mp4",
    Nombre: "08 - Nombre.mp4",
    Gracias: "14 - Gracias.mp4",
    "Por favor": "15 - Por favor.mp4",
  },
  "presentacion-2": {
    "Él": "01 - El.mp4",
    Ella: "02 - Ella.mp4",
    "Ellos / ellas": "03a - Ellos.mp4",
    Nosotros: "04 - Nosotros.mp4",
    Ustedes: "05 - Ustedes.mp4",
    "Amigo/a": "08 - Amigo - amiga.mp4",
    Bien: "10 - Bien.mp4",
    Mal: "11 - Mal.mp4",
  },
  "familia-y-amigos": {
    Familia: "01 - Familia.mp4",
    "Mamá": "02 - Mama.mp4",
    "Papá": "03 - Papa.mp4",
    Hermano: "04-05 - Hermano - hermana.mp4",
    Hermana: "04-05 - Hermano - hermana.mp4",
    Abuelo: "06-07 - Abuelo - abuela.mp4",
    Abuela: "06-07 - Abuelo - abuela.mp4",
    "Tío": "08-09 - Tio - tia.mp4",
    "Tía": "08-09 - Tio - tia.mp4",
    Primo: "10-11 - Primo - prima.mp4",
    Prima: "10-11 - Primo - prima.mp4",
    Amigo: "12-13 - Amigo - amiga.mp4",
    Amiga: "12-13 - Amigo - amiga.mp4",
    Hijo: "14 - Hijo.mp4",
    Hija: "15 - Hija.mp4",
  },
  numeros: {
    Diez: "01 - Diez.mp4",
    Veinte: "02 - Veinte.mp4",
    Treinta: "03 - Treinta.mp4",
    Cuarenta: "04 - Cuarenta.mp4",
    Cincuenta: "05 - Cincuenta.mp4",
    Sesenta: "06 - Sesenta.mp4",
    Setenta: "07 - Setenta.mp4",
    Ochenta: "08 - Ochenta.mp4",
    Noventa: "09 - Noventa.mp4",
    Cien: "10 - Cien.mp4",
    Doscientos: "11 - Doscientos.mp4",
    Quinientos: "12 - Quinientos.mp4",
    Mil: "13 - Mil.mp4",
    "Dos mil": "14 - Dos mil.mp4",
    "Un millón": "15 - Un millon.mp4",
  },
  "colegio-1": {
    Colegio: "Escuela.mp4",
    "Profesor/a": "04 - Profesor.mp4",
    Aula: "05 - Aula.mp4",
    Recreo: "06 - Recreo.mp4",
    Libro: "08 - Libro.mp4",
    Cuaderno: "09 - Cuaderno.mp4",
    "Lápiz": "10 - Lapiz.mp4",
    Aprender: "Aprender.mp4",
  },
  clima: {
    Lluvia: "02 - Lluvia.mp4",
    Nublado: "04 - Nublado.mp4",
    Granizo: "05 - Granizo.mp4",
    Nieve: "06 - Nieve.mp4",
  },
  "partes-de-la-casa": {
    Casa: "01 - Casa.mp4",
    Puerta: "02 - Puerta.mp4",
    Ventana: "03 - Ventana.mp4",
    Cocina: "04 - Cocina.mp4",
    "Baño": "05 - Banio.mp4",
    Dormitorio: "06 - Dormitorio.mp4",
    Sala: "07 - Sala.mp4",
    Comedor: "08 - Comedor.mp4",
    Techo: "09 - Techo.mp4",
    Piso: "10 - Piso.mp4",
    Pared: "11 - Pared.mp4",
    Garaje: "13 - Garaje.mp4",
  },
  comprar: {
    Comprar: "01 - Comprar.mp4",
    Vender: "02 - Vender.mp4",
    Grande: "11 - Grande.mp4",
    Pagar: "15 - Pagar.mp4",
  },
};

const CARPETAS_VIDEO: Record<string, string> = {
  "presentacion-1": "Presentacion 1",
  "presentacion-2": "Presentacion 2",
  "familia-y-amigos": "Familia y amigos",
  numeros: "Numeros",
  "colegio-1": "Colegio 1",
  clima: "Clima",
  "partes-de-la-casa": "Partes de la casa",
  comprar: "Comprar",
};

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
