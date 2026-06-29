import Image from "next/image"

export default function Foto({ user }){
    
    return(
        <Image src={user.image} alt="Foto de perfil" width={106} height={106} />
    )
}