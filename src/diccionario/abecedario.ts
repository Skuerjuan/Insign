export const LETRAS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I",
  "J", "K", "L", "M", "N", "Ñ", "O", "P", "Q",
  "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
] as const;

export type LetraAbecedario = (typeof LETRAS)[number];

export const ARCHIVOS_VIDEO_ABECEDARIO: Record<LetraAbecedario, string> = {
  A: "/Abecedario/01 - A.mp4",
  B: "/Abecedario/02 - B.mp4",
  C: "/Abecedario/03 - C.mp4",
  D: "/Abecedario/04 - D.mp4",
  E: "/Abecedario/05 - E.mp4",
  F: "/Abecedario/06 - F.mp4",
  G: "/Abecedario/07 - G.mp4",
  H: "/Abecedario/08 - H.mp4",
  I: "/Abecedario/09 - I.mp4",
  J: "/Abecedario/10 - J.mp4",
  K: "/Abecedario/11 - K.mp4",
  L: "/Abecedario/12 - L.mp4",
  M: "/Abecedario/13 - M.mp4",
  N: "/Abecedario/14 - N.mp4",
  Ñ: "/Abecedario/15 - Enie.mp4",
  O: "/Abecedario/16 - O.mp4",
  P: "/Abecedario/17 - P.mp4",
  Q: "/Abecedario/18 - Q.mp4",
  R: "/Abecedario/19 - R.mp4",
  S: "/Abecedario/20 - S.mp4",
  T: "/Abecedario/21 - T.mp4",
  U: "/Abecedario/22 - U.mp4",
  V: "/Abecedario/23 - V.mp4",
  W: "/Abecedario/24 - W.mp4",
  X: "/Abecedario/25 - X.mp4",
  Y: "/Abecedario/26 - Y.mp4",
  Z: "/Abecedario/27 - Z.mp4",
};

export const COLORES_LETRAS: Record<LetraAbecedario, string> = {
  A: "#126cff", B: "#e8b900", C: "#e91e63", D: "#126cff", E: "#4ac200", F: "#e8b900", G: "#db0000", H: "#126cff", I: "#4ac200",
  J: "#db0000", K: "#4ac200", L: "#e8b900", M: "#e91e63", N: "#126cff", Ñ: "#db0000", O: "#4ac200", P: "#e8b900", Q: "#126cff",
  R: "#e8b900", S: "#126cff", T: "#e91e63", U: "#db0000", V: "#e8b900", W: "#e91e63", X: "#126cff", Y: "#4ac200", Z: "#e8b900",
};

export function getAbecedarioVideoPath(letra: string): string {
  if (!letra) return "";
  const letraLimpia = letra.trim().toUpperCase() as LetraAbecedario;
  return ARCHIVOS_VIDEO_ABECEDARIO[letraLimpia] ?? "";
}

export function getSiguienteLetra(letraActual: string): string {
  const index = LETRAS.indexOf(letraActual.toUpperCase().trim() as LetraAbecedario);
  if (index === -1) return LETRAS[0];
  return LETRAS[(index + 1) % LETRAS.length];
}

export function getAnteriorLetra(letraActual: string): string {
  const index = LETRAS.indexOf(letraActual.toUpperCase().trim() as LetraAbecedario);
  if (index === -1) return LETRAS[LETRAS.length - 1];
  return LETRAS[(index - 1 + LETRAS.length) % LETRAS.length];
}