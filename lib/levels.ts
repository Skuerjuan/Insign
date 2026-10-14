export const LEVELS = [
  {
    id: 1,
    title: "Presentación 1",
    categoryId: "presentacion-1",
    description: "Aprende a saludar, presentarte y conocer expresiones básicas.",
    color: "#126cff",
    colorClass: "presentationOne",
  },
  {
    id: 2,
    title: "Presentación 2",
    categoryId: "presentacion-2",
    description: "Preséntate, saluda a otros y aprende preguntas básicas.",
    color: "#4ac200",
    colorClass: "presentationTwo",
  },
  {
    id: 3,
    title: "Familia y amigos",
    categoryId: "familia-y-amigos",
    description: "Conoce a los miembros de la familia y a otras personas.",
    color: "#db0000",
    colorClass: "familyAndFriends",
  },
  {
    id: 4,
    title: "Números",
    categoryId: "numeros",
    description: "Aprende los números en LSA de forma fácil y divertida.",
    color: "#c900d4",
    colorClass: "numbers",
  },
  {
    id: 5,
    title: "Colegio",
    categoryId: "colegio-1",
    description: "Aprende las señas básicas sobre el colegio y sus útiles.",
    color: "#e8b900",
    colorClass: "school",
  },
  {
    id: 6,
    title: "Clima",
    categoryId: "clima",
    description: "Aprende sobre los distintos tipos de clima.",
    color: "#00aec2",
    colorClass: "weather",
  },
  {
    id: 7,
    title: "Partes de la casa",
    categoryId: "partes-de-la-casa",
    description: "Conoce las partes de la casa y sus objetos principales.",
    color: "#ff8800",
    colorClass: "houseParts",
  },
  {
    id: 8,
    title: "Preguntas",
    categoryId: "preguntas-afuera",
    description: "Aprende preguntas y respuestas sobre orientación en LSA.",
    color: "#ff0099",
    colorClass: "questions",
  },
  {
    id: 9,
    title: "Compras",
    categoryId: "comprar",
    description: "Aprende a pedir, elegir y comprar diferentes productos.",
    color: "#002767",
    colorClass: "shopping",
  },
] as const;

export function getLevel(levelId: number) {
  return LEVELS.find((level) => level.id === levelId);
}
