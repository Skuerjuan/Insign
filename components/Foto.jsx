"use client"

import Image from "next/image";
import obtenerFoto from "./foto.util.ts"

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
