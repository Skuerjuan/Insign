import "./styles.css";
import Link from "next/link";

export default function Login() {
    return (
        <div className="fondo">
           <h1 className="logo">
            <span className="blanco">In</span>
            <span className="amarillo">Sign</span>
           </h1>
           <div className="gorilaSaludando"></div>
           <div className="container">
            <h2>¡Bienvenido!</h2>
            <p>Inicia sesion para seguir aprendiendo</p>
            <div className="inpCorreos">Correo electronico</div>
            <div className="inpkey"> Contraseña</div>
            <Link href= "">Inicia Sesion</Link>
            <p>Olvidaste tu contraseña</p>
            <p> -------------------- o continua con -------------------- </p>
             <Link href = ""> Google</Link>
             <p>¿No tienes una cuenta? Registrate</p>
           </div>
        </div>
    );
}