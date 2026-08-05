"use client";

import { addPoints } from "@/app/actions";
import Link from "next/link";

export default function BotonJugar({ styleButton, styleIcon, userId, juego }) {
    async function handleClick(e) {
        e.preventDefault(); 

        await addPoints(5, userId);

        window.location.href = juego;
    }

    return (
        <Link href={juego} className={styleButton} onClick={handleClick}>
            <span className={styleIcon} />
            Jugar
        </Link>
    );
}