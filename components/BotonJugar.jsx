"use client";

import Link from "next/link";

export default function BotonJugar({ styleButton, styleIcon, juego }) {
    return (
        <Link href={juego} className={styleButton}>
            <span className={styleIcon} />
            Jugar
        </Link>
    );
}
