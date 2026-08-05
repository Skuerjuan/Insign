"use client";

const FOTO_POR_DEFECTO = "/user.png";

export default function obtenerFoto(image: string) {
    if (!image) return FOTO_POR_DEFECTO;
    if (image.startsWith("/")) return image;
    if (image.startsWith("data:image/")) return image;

    try {
        const url = new URL(image);
        const esHttp = url.protocol === "http:" || url.protocol === "https:";
        const esBusquedaDeGoogle =
            (url.hostname === "google.com" || url.hostname === "www.google.com") &&
            url.pathname.startsWith("/search");

        return esHttp && !esBusquedaDeGoogle ? url.toString() : FOTO_POR_DEFECTO;
    } catch {
        return FOTO_POR_DEFECTO;
    }
}
