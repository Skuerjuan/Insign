"use client"

import { authClient } from "@/lib/auth/client"


export default function EditButton({ style }){



    async function modificar(){
        let nombreNuevo = prompt("Cual querés que sea tu nombre nuevo?");
        let fotoNueva = prompt("Cual querés que sea tu foto nueva?");
        const { error } = await authClient.updateUser({
            name: nombreNuevo,
            image: fotoNueva,
        });
        if(error){
            console.error(error);
        }
    }

    return(
        <button className={style} aria-label="Editar perfil" onClick={modificar}>
            <span aria-hidden="true">✎</span>
        </button>
    )
}