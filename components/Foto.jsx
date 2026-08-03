"use client"

import Image from "next/image";
import obtenerFoto from "./foto.util.ts"
import styles from "./Foto.module.css";

export default function Foto({ user, width = 106, height = 106 }) {
    return (
        <Image
            src={obtenerFoto(user?.image)}
            alt="Foto de perfil"
            width={width}
            height={height}
            className={styles.foto}
            unoptimized
            onError={(event) => {
                event.currentTarget.src = "/user.png";
            }}
        />
    );
}
