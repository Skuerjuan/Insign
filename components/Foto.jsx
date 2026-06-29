import Image from "next/image"

export default function Foto({ user, width=106, height=106 }){
    
    return(
        <Image src={user.image} alt="Foto de perfil" width={106} height={106} />
    )
}