import "./style.css";
import Link from "next/link";
import Input from "../../../components/input";

export default function register() {
 return (
    <div className="fondo">
      <h1 className="logo">
        <span className="blanco">In</span>
        <span className="amarillo">Sign</span>
      </h1>

      <div className="gorilaSaludando"></div>
        <div className="container">
            <h2>¡Crea tu cuenta!</h2>
      <Input
       placeholder="Nombre de usuario"
       type="string"
       icon="user.png"
       eyeIcon={null}
       />
        
       <Input
        placeholder="Correo Electronico"
        type="email"
        icon="card.png"
        eyeIcon={null}
        />

       <Input
        placeholder="Contraseña"
        type="password"
        icon="lock.png"
        eyeIcon="/eye.png"
        />

        <Input
        placeholder="Repetir Contraseña"
        type="password"
        icon="lock.png"
        eyeIcon="/eye.png"
        />

        <Link href="/" className="inicia">Registrarme</Link>
        </div>
      </div>
 )
}