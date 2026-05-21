import styles from "./style.module.css";
import Link from "next/link";
import Input from "../../../components/input";

export default function Register() {
  return (
    <div className={styles.fondo}>
      <h1 className={styles.logo}>
        <span className={styles.blanco}>In</span>
        <span className={styles.amarillo}>Sign</span>
      </h1>

      <div className={styles.gorilaSaludando}></div>

      <div className={styles.container}>
        <h2 className={styles.titulo}>¡Crea tu cuenta!</h2>

        <Input
          placeholder="Nombre de usuario"
          type="text"
          icon="/user.png"
          eyeIcon={null}
        />

        <Input
          placeholder="Correo electronico"
          type="email"
          icon="/card.png"
          eyeIcon={null}
        />

        <Input
          placeholder="Contraseña"
          type="password"
          icon="/lock.png"
          eyeIcon="/eye.png"
        />

        <Input
          placeholder="Repetir Contraseña"
          type="password"
          icon="/lock.png"
          eyeIcon="/eye.png"
        />

        <Link href="/auth/sign-in" className={styles.inicia}>
          Registrarme
        </Link>
      </div>
    </div>
  );
}
