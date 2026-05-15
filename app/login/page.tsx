import "./styles.css";
import Link from "next/link";
import Input from "../../components/input";

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
        />

        <Input
          placeholder="Contraseña"
          type="password"
          icon="/lock.png"
          eyeIcon="/eye.png"
        />

        <Link href="/">Inicia Sesión</Link>

        <p>Olvidaste tu contraseña</p>

        <p>-------------------- o continúa con --------------------</p>

        <Link href="/">Google</Link>

        <p>¿No tienes una cuenta? Registrate</p>
      </div>
    </div>
  );
}