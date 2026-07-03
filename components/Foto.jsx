"use client";

import Image from "next/image";

const FOTO_POR_DEFECTO = "/user.png";

function obtenerFoto(image) {
    if (!image) return FOTO_POR_DEFECTO;
    if (image.startsWith("/")) return image;

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

export default function Foto({ user, width = 106, height = 106 }) {
    return (
        <Image
            src={obtenerFoto(user?.image)}
            alt="Foto de perfil"
            width={width}
            height={height}
            unoptimized
            onError={(event) => {
                event.currentTarget.src = FOTO_POR_DEFECTO;
            }}
        />
    );
}
