"use client"

import updateNombre from "@/lib/client/updateNombre";
import updateFoto from "@/lib/client/updateFoto";

export default function EditButton({ style }){



    async function modificar(){
        let nombreNuevo = prompt("Cual querés que sea tu nombre nuevo?");
        let fotoNueva = prompt("Cual querés que sea tu foto nueva?");
        updateNombre(nombreNuevo);
        updateFoto(fotoNueva);
    }

    return(
        <button className={style} aria-label="Editar perfil" onClick={modificar}>
            <span aria-hidden="true">✎</span>
        </button>
    )
}