import Link from "next/link";
import "./styles.css";

export default function Home() {
  return (
    <div className="fondo">
      <h1 className="logo">
        <span className="blanco">In</span>
        <span className="amarillo">Sign</span>
      </h1>
      <h2>Juga, aprende y comunica</h2>
      <Link href="/auth/sign-in" className="play">Jugar</Link>
    </div>
  );
}
