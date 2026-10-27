"use client";

import { useState } from "react";
import Image from "next/image";
import signInWithGoogle from "@/lib/client/signInWithGoogle";
import styles from "./GoogleAuthButton.module.css";

export default function GoogleAuthButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch {
      setError("No se pudo continuar con Google. Inténtalo de nuevo.");
      setPending(false);
    }
  }

  return (
    <div className={styles.container}>
      <button type="button" onClick={handleClick} disabled={pending} className={styles.button}>
        <Image src="/google.png" width={24} height={24} alt="" />
        {pending ? "Conectando…" : "Continuar con Google"}
      </button>
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </div>
  );
}
