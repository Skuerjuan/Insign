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

// Fallback corregido a 'presentacion-1' para evitar referencias a 'abecedario'
export function getPalabrasPorCategoria(idCategoria: string): string[] {
  return (
    DICCIONARIO_CATEGORIAS[idCategoria] ||
    DICCIONARIO_CATEGORIAS["presentacion-1"] ||
    []
  );
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
  return getLevel(levelIdentifier)?.palabras || [];
}