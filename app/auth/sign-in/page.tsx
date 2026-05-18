import "./styles.css";
import Link from "next/link";
import Input from "../../../components/input";

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

        <p className="adInicia">
          Inicia sesión para seguir aprendiendo
        </p>

        <Input
          placeholder="Correo electrónico"
          type="email"
          icon="/user.png"
          eyeIcon={null}
        />

        <Input
          placeholder="Contraseña"
          type="password"
          icon="/lock.png"
          eyeIcon="/eye.png"
        />

        <Link href="/" className="inicia">Inicia Sesión</Link>

        <p className="olvid">¿Olvidaste tu contraseña?</p>
        <div className="separador">
        <div className="linea"></div>

        <p>o continúa con</p>

        <div className="linea"></div>
        </div>
        
       
        <button className="googleBtn">
        <img src="/google.png" className="googleIcon" />
        <Link href="/">Google</Link>
        </button>
           <div className="registro">
          <p>¿No tienes una cuenta?</p>
          <Link href="/auth/sign-up">Registrate</Link>
          </div>
       </div>
    </div>
  );
}