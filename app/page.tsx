import Link from "next/link";
import "./styles.css";

export default function Home() {
  return (
    <div className="fondo">
      <h1 className="logo">
        <span className="blanco">In</span>
        <span className="amarillo">Sign</span>
      </h1>
      <p>Juga, aprende y comunica</p>
      <Link href="/auth/sign-in">Jugar</Link>
    </div>
  );
}
